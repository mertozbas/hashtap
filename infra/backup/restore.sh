#!/usr/bin/env bash
# hashtap-restore — restore from restic snapshot
# Usage: hashtap-restore [SNAPSHOT_ID | latest]
#   Envs: RESTIC_REPOSITORY, RESTIC_PASSWORD, PGHOST, PGUSER, PGDATABASE
#
# Runbook: docs/runbooks/periyodic-restore-test.md
set -euo pipefail

: "${RESTIC_REPOSITORY:?}"
: "${RESTIC_PASSWORD:?}"

SNAPSHOT="${1:-latest}"
RESTORE_DIR="${RESTORE_DIR:-/restore}"
PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-hashtap}"
PGDATABASE="${PGDATABASE:-hashtap}"

mkdir -p "$RESTORE_DIR"

echo "[restore] $(date -Iseconds) snapshot=${SNAPSHOT} target=${RESTORE_DIR}"

restic restore "$SNAPSHOT" --target "$RESTORE_DIR"

DUMP_FILE="$(find "$RESTORE_DIR" -name 'hashtap-*.dump' -type f | sort | tail -n1)"
if [ -z "$DUMP_FILE" ]; then
  echo "[restore] ERROR: no pg dump file found under ${RESTORE_DIR}" >&2
  exit 1
fi
echo "[restore] found dump: ${DUMP_FILE}"

export PGPASSWORD="${PGPASSWORD:-hashtap}"

echo "[restore] WARNING: pg_restore will OVERWRITE database '${PGDATABASE}' on ${PGHOST}"
echo "[restore] set SKIP_PG_RESTORE=1 to only extract files"

if [ "${SKIP_PG_RESTORE:-0}" = "1" ]; then
  echo "[restore] SKIP_PG_RESTORE=1 — files extracted to ${RESTORE_DIR}, exiting"
  exit 0
fi

pg_restore \
  --host="$PGHOST" --port="$PGPORT" \
  --username="$PGUSER" --dbname="$PGDATABASE" \
  --clean --if-exists --no-owner --no-privileges \
  "$DUMP_FILE"

echo "[restore] done $(date -Iseconds)"
echo "[restore] filestore + config files are under ${RESTORE_DIR} — move them into place manually"
