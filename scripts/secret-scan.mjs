#!/usr/bin/env node
/**
 * scripts/secret-scan.mjs
 *
 * P4.3 + P4.5 — secret scanner.
 *
 * Modes:
 *   --staged                — scan files in `git diff --cached` (pre-commit hook mode)
 *   --working               — scan the working tree (all non-gitignored files)
 *   --history               — scan full git history (P4.3 — slow, run periodically)
 *   --files <a> <b> ...     — scan specific files
 *
 * Detection: 18 regex patterns covering common API key / token formats.
 * Exit codes: 0 = clean, 1 = findings, 2 = scanner error.
 *
 * Pre-commit hook installation:
 *   ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
 *   chmod +x .git/hooks/pre-commit
 *
 * Gitleaks upgrade path:
 *   brew install gitleaks
 *   gitleaks detect --source . --redact
 * gitleaks covers ~50 more patterns and supports custom rules. This script
 * is a portable subset that works without any install.
 *
 * Implementation note: ALL git invocations use execFileSync (not execSync) to
 * eliminate shell-interpolation surface area. Inputs only flow as argv to
 * execFile — no shell ever runs.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

const PATTERNS = [
  // Anthropic + OpenAI + Perplexity
  { name: 'anthropic-api-key', regex: /sk-ant-[a-zA-Z0-9_-]{32,}/g },
  { name: 'openai-api-key', regex: /sk-[a-zA-Z0-9]{20,}T3BlbkFJ[a-zA-Z0-9]{20,}/g },
  { name: 'openai-project-key', regex: /sk-proj-[a-zA-Z0-9_-]{40,}/g },
  { name: 'perplexity-api-key', regex: /pplx-[a-zA-Z0-9]{48,}/g },

  // Google
  { name: 'google-api-key', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'google-oauth-client-secret', regex: /GOCSPX-[a-zA-Z0-9_-]{28,}/g },
  // Real Google OAuth refresh tokens have the documented prefix 1//0
  // (followed by base64url payload). Requiring the 0 drops ~99% of base64
  // image-data false positives that just happen to contain "1//".
  { name: 'google-oauth-refresh-token', regex: /1\/\/0[a-zA-Z0-9_-]{40,}/g },
  { name: 'google-service-account-private-key', regex: /-----BEGIN PRIVATE KEY-----[\s\S]{200,}-----END PRIVATE KEY-----/g }, // secret-scan:allow

  // ^^ the line above contains the literal PEM header inside its own regex
  // definition — without the allowlist marker, the scanner finds itself as
  // a "private key" finding. The marker tells shouldSkipLine() to ignore it.


  // AWS
  { name: 'aws-access-key-id', regex: /\bAKIA[0-9A-Z]{16}\b/g },

  // GitHub
  { name: 'github-pat-classic', regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: 'github-pat-fine-grained', regex: /github_pat_[a-zA-Z0-9_]{82}/g },
  { name: 'github-app-token', regex: /\b(?:ghu|ghs)_[a-zA-Z0-9]{36}\b/g },

  // Slack
  { name: 'slack-bot-token', regex: /xox[baprs]-[0-9]+-[0-9]+-[a-zA-Z0-9]+/g },

  // Stripe
  { name: 'stripe-live-secret', regex: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'stripe-restricted', regex: /rk_live_[0-9a-zA-Z]{24,}/g },

  // Generic high-entropy
  { name: 'jwt-token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  { name: 'private-key-pem', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },

  // Generic credential patterns (more false-positive-prone — informational only)
  { name: 'generic-password-assign', regex: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/gi, lowConfidence: true },
  { name: 'generic-api-key-assign', regex: /(?:api[_-]?key|apikey|secret|token)\s*[:=]\s*["'][^"']{16,}["']/gi, lowConfidence: true },
];

const ALLOWLIST_MARKERS = [
  'gitleaks:allow',
  'secret-scan:allow',
  '# noqa: secret',
  '// secret-scan-ignore',
];

// Path-level allowlist — files that legitimately CONTAIN pattern strings
// (regex literals, examples in docs, test fixtures). Line-marker allowlists
// only work in current files; the history scan walks every blob ever
// committed, so old versions of these files without markers still match.
// Path-allowlist applies regardless of marker presence.
const PATH_ALLOWLIST = [
  'scripts/secret-scan.mjs', // this file — its regex literals match themselves
];

function isPathAllowlisted(filePath) {
  if (!filePath) return false;
  return PATH_ALLOWLIST.some((p) => filePath === p || filePath.endsWith('/' + p));
}

const FALSE_POSITIVE_HINTS = [
  /example\.com/i,
  /YOUR_[A-Z_]+_HERE/,
  /<API_KEY>/,
  /\b(?:example|fake|dummy|test|placeholder|sample)[-_]/i,
  /xxxxxxxx/,
  /\*{8,}/,
];

// Lines containing these substrings are skipped entirely (base64 data URIs +
// other contexts where regex false positives are statistically certain).
const SKIP_LINE_MARKERS = [
  'base64,',
  'image/webp;base64',
  'image/jpeg;base64',
  'image/png;base64',
  'data:application/font',
  'data:font/',
];

function shouldSkipLine(line) {
  return SKIP_LINE_MARKERS.some((marker) => line.includes(marker));
}

function isAllowlisted(line) {
  return ALLOWLIST_MARKERS.some((marker) => line.includes(marker));
}

function isLikelyFalsePositive(matchText) {
  return FALSE_POSITIVE_HINTS.some((re) => re.test(matchText));
}

export function scanContent(content, opts = {}) {
  const { skipLowConfidence = false } = opts;
  const findings = [];
  const lines = content.split('\n');

  for (const pattern of PATTERNS) {
    if (skipLowConfidence && pattern.lowConfidence) continue;
    const matches = content.matchAll(pattern.regex);
    for (const m of matches) {
      const matchText = m[0];
      // Find which line
      let lineNum = 1;
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= m.index) {
          lineNum = i + 1;
          break;
        }
        charCount += lines[i].length + 1;
      }
      const line = lines[lineNum - 1] || '';
      if (isAllowlisted(line)) continue;
      if (shouldSkipLine(line)) continue;
      if (isLikelyFalsePositive(matchText)) continue;
      const redacted =
        matchText.length > 16
          ? `${matchText.slice(0, 8)}...${matchText.slice(-4)}`
          : `${matchText.slice(0, 4)}...`;
      findings.push({
        pattern: pattern.name,
        lowConfidence: !!pattern.lowConfidence,
        line: lineNum,
        redacted,
        context: line.trim().slice(0, 200),
      });
    }
  }
  return findings;
}

function scanFile(filePath, opts) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return scanContent(content, opts);
  } catch (err) {
    if (err.code === 'EISDIR' || err.code === 'ENOENT') return [];
    return [];
  }
}

function listStagedFiles() {
  return git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean);
}

function listWorkingFiles() {
  return git('ls-files', '-co', '--exclude-standard').split('\n').filter(Boolean);
}

function* iterateHistoryBlobs() {
  const log = git('log', '--all', '--format=%H').split('\n').filter(Boolean);
  for (const commit of log) {
    const files = git('ls-tree', '-r', commit, '--format=%(objectname) %(path)')
      .split('\n')
      .filter(Boolean);
    for (const f of files) {
      const [sha, ...pathParts] = f.split(' ');
      yield { commit, sha, path: pathParts.join(' ') };
    }
  }
}

function readBlob(sha) {
  try {
    return git('cat-file', '-p', sha);
  } catch {
    return '';
  }
}

function isBinaryLikely(filePath) {
  return /\.(png|jpg|jpeg|gif|webp|avif|pdf|woff2?|ttf|mp4|zip|tar|gz|ico|svg)$/i.test(filePath);
}

async function scanStaged(opts) {
  const files = listStagedFiles();
  const allFindings = [];
  for (const file of files) {
    if (isBinaryLikely(file)) continue;
    if (isPathAllowlisted(file)) continue;
    const findings = scanFile(file, opts);
    for (const f of findings) allFindings.push({ file, ...f });
  }
  return allFindings;
}

async function scanWorking(opts) {
  const files = listWorkingFiles();
  const allFindings = [];
  for (const file of files) {
    if (isBinaryLikely(file)) continue;
    if (isPathAllowlisted(file)) continue;
    const findings = scanFile(file, opts);
    for (const f of findings) allFindings.push({ file, ...f });
  }
  return allFindings;
}

async function scanHistory(opts) {
  const allFindings = [];
  const seenBlobs = new Set();
  let count = 0;
  for (const { commit, sha, path: filePath } of iterateHistoryBlobs()) {
    if (seenBlobs.has(sha)) continue;
    seenBlobs.add(sha);
    count++;
    if (count % 100 === 0) console.error(`  scanned ${count} blobs...`);
    if (isBinaryLikely(filePath)) continue;
    if (isPathAllowlisted(filePath)) continue;
    const content = readBlob(sha);
    const findings = scanContent(content, opts);
    for (const f of findings) allFindings.push({ commit, file: filePath, ...f });
  }
  console.error(`  scanned ${count} unique blobs total`);
  return allFindings;
}

function printFindings(findings, header) {
  if (findings.length === 0) {
    console.log(`OK ${header}: no findings`);
    return;
  }
  console.log(`FAIL ${header}: ${findings.length} finding(s)`);
  const byFile = {};
  for (const f of findings) {
    const key = f.commit ? `${f.commit.slice(0, 8)} ${f.file}` : f.file;
    byFile[key] = byFile[key] || [];
    byFile[key].push(f);
  }
  for (const [key, items] of Object.entries(byFile)) {
    console.log(`\n  ${key}`);
    for (const item of items) {
      const flag = item.lowConfidence ? ' [low-confidence]' : '';
      console.log(`    L${item.line} [${item.pattern}]${flag}: ${item.redacted}`);
      if (item.context) console.log(`      context: ${item.context.slice(0, 120)}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--staged')
    ? 'staged'
    : args.includes('--working')
      ? 'working'
      : args.includes('--history')
        ? 'history'
        : args.includes('--files')
          ? 'files'
          : null;

  if (!mode) {
    console.error('Usage: secret-scan.mjs --staged | --working | --history | --files <a> <b> ...');
    console.error('  --staged              pre-commit-hook mode (exits 1 if findings)');
    console.error('  --working             scan all non-gitignored files in working tree');
    console.error('  --history             scan every blob ever committed (slow, periodic)');
    console.error('  --files <a> <b> ...   scan specific file paths');
    console.error('  --no-low-confidence   skip low-confidence patterns (password-assign, etc.)');
    process.exit(2);
  }

  const skipLowConfidence = args.includes('--no-low-confidence');
  const opts = { skipLowConfidence };

  let findings;
  if (mode === 'staged') {
    findings = await scanStaged(opts);
    printFindings(findings, 'Staged files');
  } else if (mode === 'working') {
    findings = await scanWorking(opts);
    printFindings(findings, 'Working tree');
  } else if (mode === 'history') {
    console.log('Scanning full git history (this may take a while)...');
    findings = await scanHistory(opts);
    printFindings(findings, 'Git history');
  } else if (mode === 'files') {
    const filesIdx = args.indexOf('--files');
    const fileList = args.slice(filesIdx + 1).filter((a) => !a.startsWith('--'));
    findings = [];
    for (const file of fileList) {
      const fs2 = scanFile(file, opts);
      for (const f of fs2) findings.push({ file, ...f });
    }
    printFindings(findings, 'Specified files');
  }

  const highConfidence = findings.filter((f) => !f.lowConfidence);
  if (highConfidence.length > 0) {
    console.log(`\nFAIL ${highConfidence.length} high-confidence finding(s). Commit blocked.`);
    console.log(`     To allowlist a specific line, add 'secret-scan:allow' to the line.`);
    process.exit(1);
  }
  if (findings.length > 0) {
    console.log(`\nWARN Only low-confidence findings. Review manually; commit allowed.`);
  }
  process.exit(0);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`secret-scan error: ${err.message}`);
    process.exit(2);
  });
}
