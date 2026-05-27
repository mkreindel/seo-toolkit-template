#!/usr/bin/env bash
# scripts/pre-commit-hook.sh
#
# P4.5 — pre-commit secret-scan hook.
#
# Installation (one-time, per clone):
#   ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# What it does:
#   Runs `node scripts/secret-scan.mjs --staged` before allowing any commit.
#   If any high-confidence secret pattern matches in staged files, the commit
#   is blocked and the finding is printed.
#
# Bypassing (use sparingly):
#   git commit --no-verify
#
# Gitleaks alternative:
#   If you `brew install gitleaks`, this script auto-detects and runs gitleaks
#   in addition to the in-house scanner. Gitleaks covers ~50 more patterns.
set -e

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# In-house scanner (always runs)
if ! node scripts/secret-scan.mjs --staged; then
  echo ""
  echo "Pre-commit blocked by secret-scan.mjs. Fix the findings above, then re-commit."
  echo "If a finding is a false positive, add 'secret-scan:allow' to the offending line."
  exit 1
fi

# Gitleaks (optional, runs if installed)
if command -v gitleaks >/dev/null 2>&1; then
  if ! gitleaks protect --staged --redact --no-banner; then
    echo ""
    echo "Pre-commit blocked by gitleaks. Fix the findings above, then re-commit."
    echo "If a finding is a false positive, add it to .gitleaks.toml allowlist."
    exit 1
  fi
fi

exit 0
