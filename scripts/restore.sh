#!/usr/bin/env bash
# Vacu — restore Postgres + uploads from a backup dir produced by backup.sh.
#
# ⚠️ DESTRUCTIVE: drops and recreates the target Postgres database, and
# replaces the contents of the uploads volume. Stop external traffic first.
#
# Usage:
#   ./scripts/restore.sh backups/20260101T030000Z
#   COMPOSE_FILE=docker-compose.yml ./scripts/restore.sh backups/<dir>

set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Usage: $0 <backup-dir>" >&2
  echo "Available:" >&2
  ls -1 ./backups 2>/dev/null | sed 's/^/  - backups\//' >&2 || true
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
POSTGRES_USER="${POSTGRES_USER:-vacu}"
POSTGRES_DB="${POSTGRES_DB:-vacu}"

DB_DUMP="$SRC/db.dump"
UPLOADS_TAR="$SRC/uploads.tar.gz"
[[ -f "$DB_DUMP" ]]     || { echo "missing $DB_DUMP" >&2; exit 1; }
[[ -f "$UPLOADS_TAR" ]] || { echo "missing $UPLOADS_TAR" >&2; exit 1; }

echo "About to restore from: $SRC"
echo "  → database $POSTGRES_DB will be DROPPED and recreated"
echo "  → uploads volume contents will be REPLACED"
read -r -p "Type 'yes' to continue: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 1; }

# --- Restore DB ---
echo "→ Dropping + recreating database ..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"

echo "→ Restoring $DB_DUMP ..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges \
  < "$DB_DUMP"

# --- Restore uploads volume ---
PROJECT="$(docker compose -f "$COMPOSE_FILE" config --format json 2>/dev/null \
  | grep -o '"name": *"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)"
PROJECT="${PROJECT:-vacu}"
UPLOADS_VOLUME="${PROJECT}_uploads"

echo "→ Wiping + repopulating $UPLOADS_VOLUME ..."
docker run --rm \
  -v "$UPLOADS_VOLUME:/target" \
  -v "$(pwd)/$SRC:/src:ro" \
  alpine:3 \
  sh -c "rm -rf /target/* /target/.[!.]* 2>/dev/null; cd /target && tar xzf /src/uploads.tar.gz"

echo "✓ Restore complete. Restart the app to reconnect:"
echo "   docker compose -f $COMPOSE_FILE restart app"
