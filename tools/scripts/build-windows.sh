#!/usr/bin/env bash
# Build the Assaut NSIS installer (.exe) via electron-builder.
#
# Pre-requisites (CI installs them in the build-windows job):
#   - The same Node + pnpm setup all jobs use
#   - electron-builder cross-compiles Windows targets from Linux without
#     wine for unsigned NSIS installers (signing requires wine/osslsigncode,
#     which is M3 deliverable per architecture.md §8)
#
# Outputs:
#   apps/assaut/release/Assaut-<version>-<arch>-Setup.exe
#   apps/assaut/release/latest.yml + .blockmap (electron-builder default)
#
# CI uploads the .exe + companion files as the `code-rouge-assaut-exe`
# artifact (14-day retention).

set -euo pipefail

APP_DIR="apps/assaut"

if [[ ! -d "${APP_DIR}" ]]; then
  printf '✗ %s missing\n' "${APP_DIR}" >&2
  exit 1
fi

printf '\n=== Building Assaut (.exe via electron-builder) ===\n'
( cd "${APP_DIR}" && pnpm package:win )

# Assert the .exe actually emerged.
shopt -s nullglob
exes=("${APP_DIR}"/release/*.exe)
shopt -u nullglob
if [[ ${#exes[@]} -eq 0 ]]; then
  printf '✗ no .exe found in %s/release\n' "${APP_DIR}" >&2
  exit 1
fi

printf '\nDone. Installers:\n'
for exe in "${exes[@]}"; do
  size=$(stat -c%s "${exe}" 2>/dev/null || stat -f%z "${exe}")
  printf '  %s (%s bytes)\n' "${exe}" "${size}"
done
