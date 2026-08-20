#!/bin/zsh
# git-autosync.sh — keep the local checkout in step with origin, safely.
#
# Designed to run unattended (launchd/cron) while humans AND coding agents
# are actively working in this checkout, so it is deliberately conservative:
#
#   - ALWAYS: `git fetch --prune` (refs stay fresh, never touches files).
#   - ONLY fast-forwards when ALL of these hold:
#       * the checked-out branch is `main`
#       * the working tree and index are completely clean
#       * local main is an ancestor of origin/main (pure fast-forward)
#   - NEVER rebases, merges, stashes, or pushes. Anything ambiguous is
#     logged and left for a human.
#   - After a fast-forward, logs actionable reminders when the lockfile or
#     the Prisma schema changed (npm install / prisma db push).
#
# Install (macOS launchd, every 5 minutes):
#   see docs/LOCAL_DEV_AUTOSYNC.md
#
# Log: ~/Library/Logs/partyhause-autosync.log

set -u

REPO="${PARTYHAUSE_REPO:-$HOME/Downloads/Partyhause}"
LOG_FILE="$HOME/Library/Logs/partyhause-autosync.log"
MAX_LOG_BYTES=524288  # 512 KB cap; truncate rather than grow forever

log() {
  print -r -- "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

# Bound the log file (Power of 10 rule 3: bound all resource growth).
if [[ -f "$LOG_FILE" ]] && (( $(stat -f%z "$LOG_FILE") > MAX_LOG_BYTES )); then
  tail -c $((MAX_LOG_BYTES / 2)) "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

cd "$REPO" 2>/dev/null || { log "SKIP: repo not found at $REPO"; exit 0; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { log "SKIP: not a git repo"; exit 0; }

# Refuse to run concurrently with another git process holding the lock.
if [[ -f .git/index.lock ]]; then
  log "SKIP: .git/index.lock present (another git process is active)"
  exit 0
fi

if ! git fetch origin --prune --quiet 2>>"$LOG_FILE"; then
  log "WARN: fetch failed (offline?)"
  exit 0
fi

branch="$(git branch --show-current)"
if [[ "$branch" != "main" ]]; then
  # Fetch-only mode: never touch a feature branch someone is working on.
  exit 0
fi

if [[ -n "$(git status --porcelain)" ]]; then
  log "SKIP: working tree dirty — fetched only"
  exit 0
fi

local_sha="$(git rev-parse main)"
remote_sha="$(git rev-parse origin/main)"
[[ "$local_sha" == "$remote_sha" ]] && exit 0

base_sha="$(git merge-base main origin/main)"
if [[ "$local_sha" != "$base_sha" ]]; then
  log "WARN: main diverged from origin/main (local $(git rev-parse --short main), remote $(git rev-parse --short origin/main)) — manual resolution required"
  exit 0
fi

changed_files="$(git diff --name-only main origin/main)"

if git merge --ff-only origin/main --quiet 2>>"$LOG_FILE"; then
  log "SYNCED: fast-forwarded main to $(git rev-parse --short main)"
  if print -r -- "$changed_files" | grep -q '^package-lock\.json$'; then
    log "REMINDER: package-lock.json changed — run: npm install"
  fi
  if print -r -- "$changed_files" | grep -q '^prisma/schema\.prisma$'; then
    log "REMINDER: prisma/schema.prisma changed — run: npx prisma db push"
  fi
else
  log "WARN: ff-only merge failed unexpectedly"
fi

exit 0
