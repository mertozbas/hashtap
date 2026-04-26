#!/usr/bin/env bash
# Installer'ı temiz Ubuntu 22.04 imajında dry-run modunda test et.
# Çalıştırma (repo root'tan):
#   bash packages/installer/test/test-fresh-ubuntu.sh
set -euo pipefail

cd "$(dirname "$0")/../../.."

echo "[test] Building fresh-ubuntu image…"
docker build \
  -f packages/installer/test/Dockerfile.fresh-ubuntu \
  -t hashtap-installer-test:latest \
  . > /tmp/installer-build.log 2>&1 || {
  echo "[test] Build başarısız — log:"
  tail -30 /tmp/installer-build.log
  exit 1
}

echo "[test] Running installer dry-run…"
OUTPUT=$(docker run --rm hashtap-installer-test:latest 2>&1)
echo "$OUTPUT"

if echo "$OUTPUT" | grep -q "Dry-run tamam"; then
  echo "[test] ✓ Installer fresh Ubuntu üstünde dry-run başarılı."
  exit 0
else
  echo "[test] ✗ Installer dry-run başarısız."
  exit 1
fi
