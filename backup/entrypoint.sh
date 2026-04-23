#!/bin/sh
# Start a busybox crond in the foreground that runs backup-runner.sh on
# ${BACKUP_SCHEDULE}. Also fires one backup immediately on boot so a
# freshly-provisioned stack has at least one snapshot.
set -eu

: "${BACKUP_SCHEDULE:?BACKUP_SCHEDULE required (cron expression)}"
: "${BACKUP_DIR:=/data/backups}"

mkdir -p "$BACKUP_DIR"

# --- crontab: runner logs to stdout so `docker logs backup` shows it ---
mkdir -p /etc/crontabs
cat > /etc/crontabs/root <<EOF
$BACKUP_SCHEDULE /usr/local/bin/backup-runner.sh
EOF

echo "[backup] schedule=$BACKUP_SCHEDULE  retain=${RETAIN_DAYS:-14}d  dir=$BACKUP_DIR"
if [ -n "${POST_BACKUP_CMD:-}" ]; then
  echo "[backup] post-hook: $POST_BACKUP_CMD"
fi

# Optional one-shot on boot (BACKUP_ON_START=1 is the default — set to 0 to skip).
if [ "${BACKUP_ON_START:-1}" = "1" ]; then
  echo "[backup] running initial backup ..."
  /usr/local/bin/backup-runner.sh || echo "[backup] initial run FAILED (will retry on schedule)"
fi

# -f foreground, -L /dev/stdout so cron lines appear in docker logs.
exec crond -f -L /dev/stdout -l 8
