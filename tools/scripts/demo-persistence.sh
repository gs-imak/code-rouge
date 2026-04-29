#!/usr/bin/env bash
# demo-persistence.sh — runs the chantier 05 / M1 validation scenario
# automatically where it can; surfaces clear instructions for the steps
# that require physical hardware.
#
# Pre-requisites: the NUC server running locally or reachable via
# ${SERVER_HOST}:${SERVER_PORT}. `pnpm dev --filter @code-rouge/server-nuc`
# in another terminal is sufficient for a dev run.
#
# Exit code: 0 if every automatable step passes; non-zero otherwise.

set -euo pipefail

SERVER_HOST="${SERVER_HOST:-127.0.0.1}"
SERVER_PORT="${SERVER_PORT:-8080}"
HEALTH_URL="http://${SERVER_HOST}:${SERVER_PORT}/health"
WS_URL="ws://${SERVER_HOST}:${SERVER_PORT}/ws"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUNDTRIP="${SCRIPT_DIR}/demo-ws-roundtrip.mjs"

step() { printf '\n=== %s ===\n' "$1"; }
ok() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1" >&2; exit 1; }

# ---------- 1. Server health ----------
step "1. NUC server health"
if ! curl -fsS "${HEALTH_URL}" >/dev/null; then
  fail "server not reachable at ${HEALTH_URL} — start it with: pnpm dev --filter @code-rouge/server-nuc"
fi
HEALTH_JSON=$(curl -fsS "${HEALTH_URL}")
ok "GET ${HEALTH_URL} → 200"
echo "    ${HEALTH_JSON}"

# ---------- 2. WS round-trip + server-side restore ----------
step "2. WebSocket persistence round-trip (5.3 AC)"
if ! command -v node >/dev/null; then
  fail "node not on PATH"
fi
SERVER_WS_URL="${WS_URL}" node "${ROUNDTRIP}"
ok "hello → state → reconnect → restore verified"

# ---------- 3. Hardware steps the script can't do ----------
step "3. Manual steps (require physical hardware)"
cat <<EOF
  These steps complete the M1 validation scenario from docs/m1-plan.md.
  Run them on the demo machines; capture screenshots into
  \`docs/demo/m1/\` for the visio handoff.

  3a. Launch the three apps in kiosk mode:
        - apps/assaut on the Windows mallette  → \`pnpm dev --filter @code-rouge/assaut\`
          (or built .exe once chantier 06+ packages it)
        - apps/attaque-de-bots on the tablet   → \`pnpm android --filter @code-rouge/attaque-de-bots\`
        - apps/debriefing on the GM smartphone → \`pnpm android --filter @code-rouge/debriefing\`
      Verify Alt+Tab / Win key / Home / Recents / Back / swipes all fail to exit.

  3b. Network diagnostic:
        - Each app's diagnostic dot is GREEN (NUC reachable).
        - Pull the NUC's network cable → dot turns RED within ~2 s.
        - Plug it back in → dot turns GREEN within ~5 s.

  3c. Team selection:
        - On Attaque de Bots, type \`7\` in the team-id input, hit Valider.
        - App lands on the first énigme step.
        - End-to-end setup time should be < 30 s per the CDC.

  3d. Persistence under force-reboot (5.1 AC):
        - On the tablet: \`adb shell am force-stop com.coderouge.attaquedebots\`
          (or pull the battery on a real device).
        - Re-launch the app.
        - Expected: lands directly on team 7's last-known step. NO flash
          of "Connexion équipe".

  3e. CI pipeline:
        - Open https://github.com/gs-imak/code-rouge/actions
        - Latest commit on \`main\` shows a green check.
        - All 5 jobs (lint, typecheck, test, build-android, build-windows)
          green.
EOF

step "Demo script complete"
ok "automatable steps passed; manual steps documented above"
ok "screenshots → docs/demo/m1/"
