#!/usr/bin/env bash
# scripts/commit-msg-hook.sh
#
# P5.3 — conventional-commits validator (commit-msg hook).
#
# Installation (one-time, per clone):
#   ln -s ../../scripts/commit-msg-hook.sh .git/hooks/commit-msg
#   chmod +x .git/hooks/commit-msg
#
# Enforces Conventional Commits (https://www.conventionalcommits.org/) lite:
#   <type>(<optional scope>): <subject>
#
# Allowed types: feat, fix, chore, docs, refactor, perf, test, build, ci, style, revert, hotfix
#
# Subject rules:
#   - First line ≤ 100 chars
#   - Lowercase first letter (after the colon)
#   - No trailing period
#
# Bypass (use sparingly): git commit --no-verify
#
# The pattern intentionally permissive — toolkit already used these informally
# (per v2 spec P5.3); this just makes it enforceable.
set -e

COMMIT_MSG_FILE="$1"
SUBJECT=$(head -n 1 "$COMMIT_MSG_FILE")

# Skip merge commits, revert commits, and fixup commits — git generates these
case "$SUBJECT" in
  Merge*|Revert*|fixup\!*|squash\!*)
    exit 0
    ;;
esac

# Conventional commits regex
# Format: <type>(<scope>)?(!)?: <subject>
# Type is one of the allowed list; scope is any non-paren chars; ! is optional
# (denotes breaking change); subject must follow the colon.
PATTERN='^(feat|fix|chore|docs|refactor|perf|test|build|ci|style|revert|hotfix)(\([a-zA-Z0-9_./-]+\))?!?: .+'

if ! [[ "$SUBJECT" =~ $PATTERN ]]; then
  echo "ERROR: commit message subject doesn't match conventional commits format"
  echo ""
  echo "  Got:      $SUBJECT"
  echo ""
  echo "  Expected: <type>(<optional scope>): <subject>"
  echo "  Types:    feat, fix, chore, docs, refactor, perf, test, build, ci, style, revert, hotfix"
  echo "  Examples:"
  echo "    feat(P3): Lighthouse 100 reach"
  echo "    fix(scripts): correct secret-scan false positive"
  echo "    chore(deps): bump vitest 4.1.6 -> 4.2.0"
  echo ""
  echo "  Bypass with: git commit --no-verify"
  exit 1
fi

# Length check on subject
if [ ${#SUBJECT} -gt 100 ]; then
  echo "ERROR: commit subject is ${#SUBJECT} chars (max 100)"
  echo "  Subject: $SUBJECT"
  echo ""
  echo "  Move detail to the body (separate from subject by a blank line)."
  echo "  Bypass with: git commit --no-verify"
  exit 1
fi

# Period-at-end check
if [[ "$SUBJECT" == *. ]]; then
  echo "ERROR: commit subject ends with a period — remove it"
  echo "  Subject: $SUBJECT"
  echo "  Bypass with: git commit --no-verify"
  exit 1
fi

exit 0
