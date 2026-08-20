# Local Dev Autosync

`scripts/git-autosync.sh` keeps a local checkout in step with `origin` without ever fighting active work. It always fetches; it fast-forwards **only** when the checkout is on `main`, the tree is clean, and local `main` is a strict ancestor of `origin/main`. It never rebases, merges, stashes, or pushes — anything ambiguous (feature branch checked out, dirty tree, diverged history, another git process holding the lock) is skipped and logged. After a sync it logs reminders when `package-lock.json` (`npm install`) or `prisma/schema.prisma` (`npx prisma db push`) changed.

Log: `~/Library/Logs/partyhause-autosync.log` (self-truncating at 512 KB).

## Install — Terminal-context daemon (recommended)

> **Why not launchd?** Empirically verified (macOS, Aug 2026): background launchd items are TCC-blocked from running git inside `~/Downloads` — `getcwd()` and `.git` access fail with "Operation not permitted" even though the plist loads and the script runs. A daemon started from a normal terminal inherits the terminal's folder access and works everywhere. See the launchd alternative below if you're willing to grant Full Disk Access.

One-time setup (copy the script out of the repo so branch switches can never remove the running copy):

```sh
mkdir -p ~/Library/Scripts
cp "$HOME/Downloads/Partyhause/scripts/git-autosync.sh" ~/Library/Scripts/partyhause-git-autosync.sh
chmod +x ~/Library/Scripts/partyhause-git-autosync.sh
```

Start the loop (idempotent — refuses to double-start):

```sh
pgrep -f partyhause-git-autosync-loop >/dev/null || \
  nohup /bin/zsh -c ': partyhause-git-autosync-loop; while :; do /bin/zsh $HOME/Library/Scripts/partyhause-git-autosync.sh; sleep 300; done' >/dev/null 2>&1 &
```

The daemon survives closing the terminal but **not reboot/logout**. To relaunch automatically on your first terminal of the day, append the same guarded one-liner to `~/.zprofile`.

Stop: `pkill -f partyhause-git-autosync-loop`
Status: `pgrep -f partyhause-git-autosync-loop && tail ~/Library/Logs/partyhause-autosync.log`

A checkout outside `~/Downloads/Partyhause` sets `PARTYHAUSE_REPO=/path/to/checkout` before the script invocation.

## Alternative — launchd (requires a GUI permission grant)

A LaunchAgent only works after you grant `/bin/zsh` **Full Disk Access** (System Settings → Privacy & Security → Full Disk Access), because of the TCC restriction above. If you've done that:

```sh
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

Uninstall: `launchctl bootout gui/$(id -u)/com.partyhause.git-autosync && rm ~/Library/LaunchAgents/com.partyhause.git-autosync.plist`

## Verified behaviors (Aug 2026)

- `SYNCED: fast-forwarded main to <sha>` on a clean, behind checkout — tree ends clean at origin's tip
- `SKIP: working tree dirty — fetched only` — branch pointer untouched
- Feature branch checked out → silent fetch-only (no log spam every 5 minutes)
- Missing repo / concurrent git lock → logged skip, exit 0
- Daemon context: fetch confirmed against the live checkout (`.git/FETCH_HEAD` updated)
- launchd context without Full Disk Access: git fails with `Unable to read current working directory: Operation not permitted` / `not a git repository` — this is macOS TCC, not a script defect
