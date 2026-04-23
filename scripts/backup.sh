#!/usr/bin/env bash
# Vacu — ad-hoc snapshot from the dev/admin host. For scheduled runs use
# the `backup` sidecar service in docker-compose.prod.yml.
#
# Writes to ./backups/<timestamp>/ on the host (NOT the `backups` volume).
# Useful for: on-demand snapshots before risky ops, or running against the
# local dev stack.
#
# Usage:
#   ./scripts/backup.sh
#   RETAIN=30 ./scripts/backup.sh
#   COMPOSE_FILE=docker-compose.yml ./scripts/backup.sh   # dev stack

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN="${RETAIN:-14}"
POSTGRES_USER="${POSTGRES_USER:-vacu}"
POSTGRES_DB="${POSTGRES_DB:-vacu}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/$TS"
mkdir -p "$OUT"

echo "→ Backup target: $OUT"

# --- Postgres dump (schema + data, custom format for fast restore) ---
echo "→ Dumping Postgres ($POSTGRES_DB) ..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$OUT/db.dump"

# Also write a gzipped plain-SQL for emergency inspection.
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip -9 > "$OUT/db.sql.gz"

# --- Uploads tarball ---
# Find the mounted uploads volume via compose project name.
PROJECT="$(docker compose -f "$COMPOSE_FILE" config --format json 2>/dev/null \
  | grep -o '"name": *"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)"
PROJECT="${PROJECT:-vacu}"
UPLOADS_VOLUME="${PROJECT}_uploads"

echo "→ Archiving uploads volume ($UPLOADS_VOLUME) ..."
docker run --rm \
  -v "$UPLOADS_VOLUME:/source:ro" \
  -v "$(pwd)/$OUT:/target" \
  alpine:3 \
  sh -c "cd /source && tar czf /target/uploads.tar.gz ."

# --- Record versions ---
{
  echo "timestamp: $TS"
  echo "compose_file: $COMPOSE_FILE"
  echo "app_image: $(docker compose -f "$COMPOSE_FILE" images app --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || echo unknown)"
  echo "git_sha: $(git rev-parse HEAD 2>/dev/null || echo unknown)"
} > "$OUT/meta.txt"

# --- Prune old backups ---
if [[ "$RETAIN" -gt 0 ]]; then
  echo "→ Pruning backups older than $RETAIN days ..."
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETAIN" \
    -print -exec rm -rf {} +
fi

SIZE="$(du -sh "$OUT" | cut -f1)"
echo "✓ Backup complete — $OUT ($SIZE)"
