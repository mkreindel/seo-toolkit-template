/**
 * scripts/lib/cron-mode.mjs
 *
 * Shared helpers for cron-mode detection + escalation pattern.
 *
 * Convention:
 *   - Cron prompts end with `--cron` flag
 *   - Skills + scripts call isCronMode(process.argv) at start
 *   - If true: skip AskUserQuestion calls, route escalations via writeInboxItem(), exit cleanly
 *
 * See: docs/specs/2026-05-16-agents-cruise-control-design.md § Escalation contract
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export function isCronMode(argv) {
  return argv.includes('--cron');
}

export function formatInboxFilename({ date = new Date(), routine, topic }) {
  const yyyymmdd = date.toISOString().split('T')[0];
  const safeTopic = topic
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${yyyymmdd}-${routine}-${safeTopic}.md`;
}

/**
 * Write an _inbox/ item per the escalation contract.
 * @returns {Promise<string>} absolute path of written file
 */
export async function writeInboxItem({
  siteDir,
  routine,
  routineVersion,
  topic,
  site = null,
  trigger,
  whatITried,
  whatINeed,
  suggestedAction = null,
  contextLinks = [],
  date = new Date(),
}) {
  const inboxDir = path.join(siteDir, '_inbox');
  await fs.mkdir(inboxDir, { recursive: true });
  const filename = formatInboxFilename({ date, routine, topic });
  const filepath = path.join(inboxDir, filename);

  const yyyymmdd = date.toISOString().split('T')[0];
  const content = `# ${routine} — ${topic} — ${yyyymmdd}

**Status:** OPEN
**Routine:** ${routine}
**routine_version:** ${routineVersion}
**Site:** ${site || 'portfolio'}
**Trigger:** ${trigger}
${suggestedAction ? `**Suggested action:** ${suggestedAction}\n` : ''}
## What I tried

${whatITried}

## What I need from you

${whatINeed}

## Context links

${contextLinks.length ? contextLinks.map((l) => `- \`${l}\``).join('\n') : '(none)'}
`;

  await fs.writeFile(filepath, content, 'utf8');
  return filepath;
}
