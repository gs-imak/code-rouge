#!/usr/bin/env bash
# install-nuc.sh — provision the Intel NUC to run the Code Rouge server.
#
# Usage (on a fresh Ubuntu 22.04 / 24.04 LTS NUC, run as a sudoer):
#   curl -fsSL https://raw.githubusercontent.com/<repo>/main/tools/scripts/install-nuc.sh | sudo bash
# Or from a clone:
#   sudo ./tools/scripts/install-nuc.sh
#
# Idempotent: re-running on an already-provisioned NUC is safe — every
# install / write step checks-then-acts.
#
# What it does:
#   1. Installs Node 24 LTS via NodeSource (`setup_24.x`).
#   2. Enables corepack so pnpm matches the version pinned in package.json.
#   3. Creates the `code-rouge` system user and `/opt/code-rouge` checkout.
#   4. Pulls the repo (clone on first run, fetch+reset on re-runs).
#   5. Installs prod dependencies with `pnpm install --frozen-lockfile`.
#   6. Writes /etc/systemd/system/code-rouge-server.service.
#   7. Creates /var/log/code-rouge owned by code-rouge.
#   8. systemctl daemon-reload, enable, restart code-rouge-server.
#
# What it does NOT do:
#   - Configure the venue Wi-Fi router (out of scope, manual).
#   - Open firewall ports — assume LAN-only via venue router.
#   - Generate per-session reset codes — server does this at boot.

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
LISTEN_HOST="${LISTEN_HOST:-127.0.0.1}"  # set to LAN interface IP in production
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

# ---------- 1. Node.js 24 LTS via NodeSource ----------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null | cut -dv -f2 | cut -d. -f1)" -lt "${NODE_MAJOR}" ]]; then
  echo "[install-nuc] installing Node.js ${NODE_MAJOR} via NodeSource"
  apt-get update -y
  apt-get install -y curl ca-certificates gnupg
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
else
  echo "[install-nuc] Node.js $(node -v) already present, skipping NodeSource"
fi

# ---------- 2. pnpm via corepack ----------
echo "[install-nuc] enabling corepack + pnpm"
corepack enable
corepack prepare pnpm@latest --activate

# ---------- 3. App user + filesystem layout ----------
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

# ---------- 5. Install prod dependencies ----------
echo "[install-nuc] installing pnpm dependencies (production)"
sudo -u "${APP_USER}" --preserve-env=NODE_MAJOR \
  bash -c "cd '${APP_DIR}' && pnpm install --frozen-lockfile --prod=false"
# --prod=false because the workspace shares a single lockfile and tsx is
# in server-nuc's runtime dependencies. We do not run a tsc build step:
# the server is launched via tsx in production (chantier 03; revisit for
# bundle/perf in M2 if cold-start matters).

# ---------- 6. systemd unit ----------
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
echo "[install-nuc] writing ${SERVICE_PATH}"
cat >"${SERVICE_PATH}" <<EOF
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

[Install]
WantedBy=multi-user.target
EOF

# ---------- 7. Logrotate ----------
LOGROTATE_PATH="/etc/logrotate.d/${SERVICE_NAME}"
echo "[install-nuc] writing ${LOGROTATE_PATH}"
cat >"${LOGROTATE_PATH}" <<EOF
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

# ---------- 8. Reload + enable + start ----------
echo "[install-nuc] reloading systemd and enabling ${SERVICE_NAME}"
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service"

echo "[install-nuc] done."
echo "  status:  systemctl status ${SERVICE_NAME}"
echo "  logs:    tail -f ${LOG_DIR}/server.log"
echo "  health:  curl http://${LISTEN_HOST}:${LISTEN_PORT}/health"
