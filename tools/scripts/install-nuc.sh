#!/usr/bin/env bash
# install-nuc.sh — provision the Intel NUC to run the Code Rouge server.
#
# RECOMMENDED: clone the repo first, inspect, then run locally:
#   git clone https://github.com/gs-imak/code-rouge.git /tmp/code-rouge
#   sudo LISTEN_HOST=192.168.42.10 /tmp/code-rouge/tools/scripts/install-nuc.sh
#
# `curl ... | sudo bash` IS NOT RECOMMENDED — there is no signature check
# on the piped stream. If you must, pin a tag/sha in the URL.
#
# Idempotent: re-running on an already-provisioned NUC is safe — every
# install / write step checks-then-acts. The systemd unit is reloaded
# only if the file changed.
#
# What it does:
#   1. Installs Node ${NODE_MAJOR} LTS via NodeSource (with sha256 verification).
#   2. Enables corepack and activates the pnpm version pinned in package.json.
#   3. Creates the `code-rouge` system user and `/opt/code-rouge` checkout.
#   4. Pulls the repo (clone on first run, fetch+reset on re-runs).
#   5. Installs prod dependencies with `pnpm install --frozen-lockfile`.
#   6. Writes /etc/systemd/system/code-rouge-server.service (sandboxed).
#   7. Creates /var/log/code-rouge owned by code-rouge (logrotate weekly).
#   8. systemctl daemon-reload, enable, reload-or-restart code-rouge-server.
#   9. Runs a post-install health check against the configured LISTEN_HOST.

set -euo pipefail

# ---------- Configurable knobs (override via env) ----------
NODE_MAJOR="${NODE_MAJOR:-24}"
APP_USER="${APP_USER:-code-rouge}"
APP_DIR="${APP_DIR:-/opt/code-rouge}"
LOG_DIR="${LOG_DIR:-/var/log/code-rouge}"
DATA_DIR="${DATA_DIR:-/var/lib/code-rouge}"
REPO_URL="${REPO_URL:-https://github.com/gs-imak/code-rouge.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-code-rouge-server}"
LISTEN_HOST="${LISTEN_HOST:-127.0.0.1}"
LISTEN_PORT="${LISTEN_PORT:-8080}"

# ---------- Sanity checks ----------
if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run with sudo (this script provisions system services)" >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "error: this script targets Debian/Ubuntu (apt-get not found)" >&2
  exit 1
fi

# Reject the most common mis-config — a deployer panic-binding to all
# interfaces because LAN IP wasn't set. The venue router shouldn't forward
# 8080 from WAN, but defense in depth: never let 0.0.0.0 happen.
if [[ "${LISTEN_HOST}" == "0.0.0.0" ]]; then
  echo "error: LISTEN_HOST=0.0.0.0 is not permitted." >&2
  echo "  Bind to the explicit LAN interface IP. Find it with:" >&2
  echo "    ip -4 addr show | awk '/inet .* scope global/ {print \$2}'" >&2
  exit 1
fi

# Soft warning on loopback default — not fatal because there are legitimate
# loopback-only test installs.
if [[ "${LISTEN_HOST}" == "127.0.0.1" ]]; then
  echo "WARNING: LISTEN_HOST=127.0.0.1 — server will not be reachable from the LAN." >&2
  echo "  In production, re-run with: sudo LISTEN_HOST=<NUC-LAN-IP> $0" >&2
fi

# ---------- 1. Node.js LTS via NodeSource ----------
if ! command -v node >/dev/null 2>&1 || \
   [[ "$(node -v 2>/dev/null | cut -dv -f2 | cut -d. -f1)" -lt "${NODE_MAJOR}" ]]; then
  echo "[install-nuc] installing Node.js ${NODE_MAJOR} via NodeSource"
  apt-get update -y
  apt-get install -y curl ca-certificates gnupg
  # Pull the NodeSource setup script to a tempfile and inspect before exec.
  # An attacker who MITMs the venue uplink during install would otherwise
  # get root code execution via `curl | bash`.
  setup_script=$(mktemp)
  trap 'rm -f "${setup_script}"' EXIT
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o "${setup_script}"
  if [[ -n "${NODESOURCE_SETUP_SHA256:-}" ]]; then
    echo "${NODESOURCE_SETUP_SHA256}  ${setup_script}" | sha256sum --check --status \
      || { echo "error: NodeSource setup script checksum mismatch" >&2; exit 1; }
  else
    echo "[install-nuc] NodeSource setup not pinned (NODESOURCE_SETUP_SHA256 unset);" >&2
    echo "  for higher assurance, pin to a known-good sha256." >&2
  fi
  bash "${setup_script}"
  apt-get install -y nodejs
else
  echo "[install-nuc] Node.js $(node -v) already present, skipping NodeSource"
fi

# ---------- 3. App user + filesystem layout (before clone) ----------
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  echo "[install-nuc] creating system user ${APP_USER}"
  useradd --system --no-create-home --shell /usr/sbin/nologin "${APP_USER}"
fi

install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${APP_DIR}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${LOG_DIR}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${DATA_DIR}"

# ---------- 4. Clone or update the repo ----------
if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "[install-nuc] cloning ${REPO_URL} into ${APP_DIR}"
  sudo -u "${APP_USER}" git clone --branch "${REPO_BRANCH}" --depth 1 "${REPO_URL}" "${APP_DIR}"
else
  echo "[install-nuc] updating existing checkout in ${APP_DIR}"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch --depth 1 origin "${REPO_BRANCH}"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" reset --hard "origin/${REPO_BRANCH}"
fi

# ---------- 2. pnpm via corepack (after clone so we can read packageManager) ----------
echo "[install-nuc] activating pinned pnpm version from package.json"
PINNED_PNPM=$(node -e "const p=require('${APP_DIR}/package.json'); process.stdout.write(p.packageManager || '')")
if [[ -z "${PINNED_PNPM}" ]]; then
  echo "error: ${APP_DIR}/package.json has no packageManager field" >&2
  exit 1
fi
corepack enable
corepack prepare "${PINNED_PNPM}" --activate

# ---------- 5. Install dependencies ----------
echo "[install-nuc] installing pnpm dependencies"
# `--prod=false` because the workspace shares one lockfile and tsx is in
# server-nuc's runtime deps. TODO(chantier-04): split tsx out via a
# pre-compiled `tsc --outDir dist`, then switch to --prod to exclude
# devDependencies on the NUC.
sudo -u "${APP_USER}" \
  bash -c "cd '${APP_DIR}' && pnpm install --frozen-lockfile --prod=false"

# ---------- 6. systemd unit ----------
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
NEW_SERVICE_FILE=$(mktemp)
trap 'rm -f "${NEW_SERVICE_FILE}" "${setup_script:-}"' EXIT

cat >"${NEW_SERVICE_FILE}" <<EOF
[Unit]
Description=Code Rouge — local NUC server (WS + SQLite + /health)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/pnpm --filter @code-rouge/server-nuc start
Environment=NODE_ENV=production
Environment=HOST=${LISTEN_HOST}
Environment=PORT=${LISTEN_PORT}
Environment=DATABASE_PATH=${DATA_DIR}/coderouge.sqlite
Environment=LOG_LEVEL=info
StandardOutput=append:${LOG_DIR}/server.log
StandardError=append:${LOG_DIR}/server.log
Restart=on-failure
RestartSec=2s
TimeoutStopSec=10s

# Hardening — server only ever talks to the LAN.
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=${LOG_DIR} ${DATA_DIR}
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
LockPersonality=true
RestrictRealtime=true
SystemCallArchitectures=native

# Resource ceiling — keep a runaway process from eating the NUC.
MemoryMax=512M
MemorySwapMax=0
CPUQuota=80%

# Outbound network confined to RFC-1918 + loopback. Per CLAUDE.md rule 6
# the server makes no internet calls at runtime; this enforces it via the
# kernel's BPF filter rather than relying on app-level discipline.
IPAddressAllow=localhost 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16
IPAddressDeny=any

[Install]
WantedBy=multi-user.target
EOF

if [[ -f "${SERVICE_PATH}" ]] && cmp -s "${NEW_SERVICE_FILE}" "${SERVICE_PATH}"; then
  echo "[install-nuc] ${SERVICE_NAME}.service unchanged"
  service_changed=0
else
  echo "[install-nuc] writing ${SERVICE_PATH}"
  install -m 0644 "${NEW_SERVICE_FILE}" "${SERVICE_PATH}"
  service_changed=1
fi

# ---------- 7. Logrotate ----------
LOGROTATE_PATH="/etc/logrotate.d/${SERVICE_NAME}"
NEW_LOGROTATE_FILE=$(mktemp)
trap 'rm -f "${NEW_LOGROTATE_FILE}" "${NEW_SERVICE_FILE}" "${setup_script:-}"' EXIT
cat >"${NEW_LOGROTATE_FILE}" <<EOF
${LOG_DIR}/*.log {
  weekly
  rotate 8
  compress
  delaycompress
  missingok
  notifempty
  create 0640 ${APP_USER} ${APP_USER}
  postrotate
    systemctl kill -s HUP ${SERVICE_NAME}.service >/dev/null 2>&1 || true
  endscript
}
EOF
if ! [[ -f "${LOGROTATE_PATH}" ]] || ! cmp -s "${NEW_LOGROTATE_FILE}" "${LOGROTATE_PATH}"; then
  echo "[install-nuc] writing ${LOGROTATE_PATH}"
  install -m 0644 "${NEW_LOGROTATE_FILE}" "${LOGROTATE_PATH}"
fi

# ---------- 8. Reload + enable + (only restart if unit changed or never started) ----------
echo "[install-nuc] reloading systemd"
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"

if [[ "${service_changed}" == "1" ]] || ! systemctl is-active --quiet "${SERVICE_NAME}.service"; then
  echo "[install-nuc] (re)starting ${SERVICE_NAME}"
  systemctl reload-or-restart "${SERVICE_NAME}.service"
else
  echo "[install-nuc] ${SERVICE_NAME} already active and unit unchanged — leaving it running"
fi

# ---------- 9. Post-install health check ----------
echo "[install-nuc] verifying health endpoint"
sleep 2
if curl -fsS "http://${LISTEN_HOST}:${LISTEN_PORT}/health" >/dev/null; then
  echo "[install-nuc] health check OK at http://${LISTEN_HOST}:${LISTEN_PORT}/health"
else
  echo "WARNING: health check failed at http://${LISTEN_HOST}:${LISTEN_PORT}/health" >&2
  echo "  systemctl status ${SERVICE_NAME}    # check process state" >&2
  echo "  tail ${LOG_DIR}/server.log          # check error logs" >&2
fi

echo "[install-nuc] done."
echo "  status:  systemctl status ${SERVICE_NAME}"
echo "  logs:    tail -f ${LOG_DIR}/server.log"
echo "  health:  curl http://${LISTEN_HOST}:${LISTEN_PORT}/health"
