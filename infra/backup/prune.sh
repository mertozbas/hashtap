#!/usr/bin/env bash
# hashtap-prune — retention policy enforcement
# --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --keep-yearly 3
set -euo pipefail

: "${RESTIC_REPOSITORY:?}"
: "${RESTIC_PASSWORD:?}"

echo "[prune] $(date -Iseconds) start"

restic forget \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 12 \
  --keep-yearly 3 \
  --prune

echo "[prune] done $(date -Iseconds)"
