#!/bin/sh
# One-shot: dump DB + tar uploads into $BACKUP_DIR/<ts>/, prune old dirs,
# run optional POST_BACKUP_CMD. Fails loudly; cron retries next slot.
set -eu

: "${PGHOST:?}"
: "${PGUSER:?}"
: "${PGPASSWORD:?}"
: "${PGDATABASE:?}"
: "${BACKUP_DIR:=/data/backups}"
: "${UPLOADS_DIR:=/data/uploads}"
: "${RETAIN_DAYS:=14}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/$TS"
mkdir -p "$OUT"

log() { echo "[backup $TS] $*"; }

log "starting"

# --- Postgres: custom format (fast pg_restore) + gzipped plain SQL ---
log "pg_dump -Fc → db.dump"
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -Fc -f "$OUT/db.dump"

log "pg_dump plain → db.sql.gz"
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" | gzip -9 > "$OUT/db.sql.gz"

# --- Uploads ---
if [ -d "$UPLOADS_DIR" ]; then
  log "tar uploads → uploads.tar.gz"
  tar -C "$UPLOADS_DIR" -czf "$OUT/uploads.tar.gz" .
else
  log "uploads dir ($UPLOADS_DIR) missing, skipping"
fi

# --- Metadata ---
{
  echo "timestamp: $TS"
  echo "pg_host: $PGHOST"
  echo "pg_db: $PGDATABASE"
  echo "sizes:"
  ls -lh "$OUT" | awk 'NR>1 {print "  "$NF": "$5}'
} > "$OUT/meta.txt"

SIZE="$(du -sh "$OUT" | cut -f1)"
log "snapshot complete — $OUT ($SIZE)"

# --- Off-site hook ---
if [ -n "${POST_BACKUP_CMD:-}" ]; then
  log "running POST_BACKUP_CMD ..."
  # Exported so the user command can read BACKUP_DIR / OUT / TS directly.
  export BACKUP_DIR OUT TS
  if sh -c "$POST_BACKUP_CMD"; then
    log "post-hook OK"
  else
    log "post-hook FAILED (snapshot still retained locally)"
  fi
fi

# --- Prune ---
if [ "$RETAIN_DAYS" -gt 0 ]; then
  log "pruning dirs older than $RETAIN_DAYS days"
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETAIN_DAYS" \
    -print -exec rm -rf {} +
fi

log "done"
