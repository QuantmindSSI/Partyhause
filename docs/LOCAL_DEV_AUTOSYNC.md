# Local Dev Autosync

`scripts/git-autosync.sh` keeps a local checkout in step with `origin` without ever fighting active work. It always fetches; it fast-forwards **only** when the checkout is on `main`, the tree is clean, and local `main` is a strict ancestor of `origin/main`. It never rebases, merges, stashes, or pushes — anything ambiguous (feature branch checked out, dirty tree, diverged history, another git process holding the lock) is skipped and logged. After a sync it logs reminders when `package-lock.json` (`npm install`) or `prisma/schema.prisma` (`npx prisma db push`) changed.

Log: `~/Library/Logs/partyhause-autosync.log` (self-truncating at 512 KB).

## Install on macOS (launchd, every 5 minutes)

Run the agent from a **copy outside the repo** — the checkout switches branches and gets rewritten constantly, and the scheduler must not depend on a file that a branch switch can remove:

```sh
mkdir -p ~/Library/Scripts
cp "$HOME/Downloads/Partyhause/scripts/git-autosync.sh" ~/Library/Scripts/partyhause-git-autosync.sh
chmod +x ~/Library/Scripts/partyhause-git-autosync.sh

cat > ~/Library/LaunchAgents/com.partyhause.git-autosync.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.partyhause.git-autosync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>HOME_PATH/Library/Scripts/partyhause-git-autosync.sh</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
EOF
sed -i '' "s|HOME_PATH|$HOME|" ~/Library/LaunchAgents/com.partyhause.git-autosync.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.partyhause.git-autosync.plist
```

The script defaults to `~/Downloads/Partyhause`; a checkout elsewhere can set `PARTYHAUSE_REPO` via the plist's `EnvironmentVariables` dict. After pulling script updates from the repo, re-copy it to `~/Library/Scripts/`.

Check it: `launchctl kickstart gui/$(id -u)/com.partyhause.git-autosync && tail ~/Library/Logs/partyhause-autosync.log`

Uninstall: `launchctl bootout gui/$(id -u)/com.partyhause.git-autosync && rm ~/Library/LaunchAgents/com.partyhause.git-autosync.plist`

## Verified behaviors (Aug 2026)

- `SYNCED: fast-forwarded main to <sha>` on a clean, behind checkout — tree ends clean at origin's tip
- `SKIP: working tree dirty — fetched only` — branch pointer untouched
- Feature branch checked out → silent fetch-only (no log spam every 5 minutes)
- Missing repo / concurrent git lock → logged skip, exit 0
