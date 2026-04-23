#!/usr/bin/env bash
set -euo pipefail

: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"
: "${HASHTAP_INSTALLATION_ID:?HASHTAP_INSTALLATION_ID is required}"

echo "[entrypoint] HashTap backup runner"
echo "[entrypoint] repo=${RESTIC_REPOSITORY}"
echo "[entrypoint] install=${HASHTAP_INSTALLATION_ID}"

if ! restic snapshots --quiet >/dev/null 2>&1; then
  echo "[entrypoint] initializing restic repository..."
  restic init
fi

mkdir -p /var/log /backup/pg

case "${1:-cron}" in
  cron)
    echo "[entrypoint] starting cron scheduler"
    touch /var/log/hashtap-backup.log
    crond -f -L /dev/stdout &
    CRON_PID=$!
    tail -F /var/log/hashtap-backup.log &
    wait "$CRON_PID"
    ;;
  backup)
    exec /usr/local/bin/hashtap-backup
    ;;
  restore)
    shift
    exec /usr/local/bin/hashtap-restore "$@"
    ;;
  prune)
    exec /usr/local/bin/hashtap-prune
    ;;
  *)
    exec "$@"
    ;;
esac
