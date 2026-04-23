#!/usr/bin/env bash
# hashtap-backup — pg_dump + restic snapshot
# Schedule: nightly 03:00 (see crontab)
set -euo pipefail

: "${HASHTAP_INSTALLATION_ID:?}"
: "${RESTIC_REPOSITORY:?}"
: "${RESTIC_PASSWORD:?}"

PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-hashtap}"
PGDATABASE="${PGDATABASE:-hashtap}"
FILESTORE_PATH="${FILESTORE_PATH:-/backup/filestore}"
CONFIG_PATH="${CONFIG_PATH:-/backup/config}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_DIR="/backup/pg"
DUMP_FILE="${DUMP_DIR}/hashtap-${STAMP}.dump"

mkdir -p "$DUMP_DIR"

echo "[backup] $(date -Iseconds) start installation=${HASHTAP_INSTALLATION_ID}"

export PGPASSWORD="${PGPASSWORD:-hashtap}"

echo "[backup] pg_dump -> ${DUMP_FILE}"
pg_dump \
  --host="$PGHOST" --port="$PGPORT" \
  --username="$PGUSER" --dbname="$PGDATABASE" \
  --format=custom --compress=9 \
  --file="$DUMP_FILE"

SOURCES=("$DUMP_DIR")
[ -d "$FILESTORE_PATH" ] && SOURCES+=("$FILESTORE_PATH")
[ -d "$CONFIG_PATH" ] && SOURCES+=("$CONFIG_PATH")

echo "[backup] restic backup -> ${RESTIC_REPOSITORY}"
restic backup \
  --tag "installation=${HASHTAP_INSTALLATION_ID}" \
  --tag "stamp=${STAMP}" \
  --host "$HASHTAP_INSTALLATION_ID" \
  "${SOURCES[@]}"

echo "[backup] cleaning local dump (kept in restic)"
rm -f "$DUMP_FILE"

echo "[backup] done $(date -Iseconds)"
