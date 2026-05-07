#!/usr/bin/env bash
# demo-prep.sh — one-shot launcher for the M1 validation visio.
# Run at ~14h45 from the repo root: `bash tools/scripts/demo-prep.sh`
#
# What it does, in order:
#   1. Kills any leftover electron / node processes hogging the demo ports.
#   2. Boots the NUC server in the background; waits for it to listen on :8080.
#   3. Runs the persistence demo script as a sanity check (PASS/FAIL surfaced).
#   4. Boots the assaut Electron app in the background; waits for window.
#   5. Opens browser tabs for: GitHub Actions, /diag JSON, handoff PDF.
#   6. Tails both server and assaut logs side-by-side until you Ctrl-C.
#
# After the call: Ctrl-C this script. Cleanup is automatic via the EXIT
# trap below — the background `pnpm dev` process trees, any spawned
# electron.exe, and any holders of the demo ports (8080/5173/5174) are
# all swept on every exit path (success, failure, Ctrl-C). No manual
# taskkill follow-up needed.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_LOG="/tmp/demo-server.log"
ASSAUT_LOG="/tmp/demo-assaut.log"
PDF_PATH="${REPO_ROOT}/docs/m1-handoff-validation.pdf"
GH_ACTIONS_URL="https://github.com/gs-imak/code-rouge/actions"
DIAG_URL="http://127.0.0.1:8080/diag"

step() { printf '\n=== %s ===\n' "$1"; }
ok()   { printf '  \xe2\x9c\x93 %s\n' "$1"; }
warn() { printf '  ! %s\n' "$1"; }
fail() { printf '  X %s\n' "$1" >&2; }

# ---------- Cleanup trap — sweep background processes on any exit -----------
# Earlier versions of this script left orphan `pnpm dev` watchers and
# kiosk Electron windows alive after Ctrl-C of the `tail -F` at the end.
# On a dev workstation that combination once required a sign-out to
# recover (kiosk window swallowed every escape key — fixed in
# apps/assaut/src/main/index.ts by gating kiosk on isProduction, but
# the orphan-process hazard stays even without the kiosk grab).
SERVER_PID=""
ASSAUT_PID=""

cleanup() {
  local code=$?
  step "Cleanup — sweeping demo background processes"
  for pid in "$SERVER_PID" "$ASSAUT_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      taskkill //F //T //PID "$pid" >/dev/null 2>&1 \
        && ok "killed PID $pid (process tree)" \
        || warn "could not kill PID $pid"
    fi
  done
  taskkill //F //IM electron.exe >/dev/null 2>&1 \
    && ok "swept stray electron.exe" || true
  for port in 8080 5173 5174; do
    pid=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p && $4=="LISTENING" {print $5; exit}')
    if [[ -n "${pid:-}" ]]; then
      taskkill //F //T //PID "$pid" >/dev/null 2>&1 \
        && ok "freed port $port (pid $pid)" || true
    fi
  done
  exit "$code"
}
trap cleanup INT TERM EXIT

# ---------- 1. Kill stragglers ----------
step "1. Killing stale electron / dev-server processes"
taskkill //F //IM electron.exe >/dev/null 2>&1 && ok "killed electron.exe" || warn "no electron.exe running"
# Best-effort: anything bound to 8080 / 5173 / 5174.
for port in 8080 5173 5174; do
  pid=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p && $4=="LISTENING" {print $5; exit}')
  if [[ -n "$pid" ]]; then
    taskkill //F //PID "$pid" >/dev/null 2>&1 && ok "freed port $port (pid $pid)" || warn "could not free port $port"
  fi
done
sleep 2

# ---------- 2. Boot NUC server ----------
step "2. Booting NUC server"
cd "$REPO_ROOT"
rm -f "$SERVER_LOG"
nohup pnpm dev --filter @code-rouge/server-nuc >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
ok "spawned PID $SERVER_PID, waiting for 'listening'..."

deadline=$((SECONDS + 60))
until grep -q "server listening" "$SERVER_LOG" 2>/dev/null; do
  if (( SECONDS > deadline )); then
    fail "server did not listen within 60 s"; tail -20 "$SERVER_LOG"; exit 1
  fi
  sleep 1
done
ok "server listening on :8080"

# ---------- 3. Persistence sanity check ----------
step "3. Persistence round-trip sanity (demo-persistence.sh)"
if bash "${REPO_ROOT}/tools/scripts/demo-persistence.sh" >/tmp/demo-persistence.out 2>&1; then
  ok "persistence demo PASS"
else
  fail "persistence demo FAILED — see /tmp/demo-persistence.out"
  tail -30 /tmp/demo-persistence.out
  warn "continuing anyway (visual demo can still proceed)"
fi

# ---------- 4. Boot assaut ----------
step "4. Booting assaut Electron app"
rm -f "$ASSAUT_LOG"
nohup pnpm dev --filter @code-rouge/assaut >"$ASSAUT_LOG" 2>&1 &
ASSAUT_PID=$!
ok "spawned PID $ASSAUT_PID, waiting for kiosk window..."

deadline=$((SECONDS + 90))
# `[assaut] window ready` is emitted from main on ready-to-show — fires
# in both dev and prod. The legacy `globalShortcut.register` signal no
# longer appears in dev (kiosk gated on isProduction) so the wait would
# time out; keep it as an additional success marker for prod boots.
until grep -qE "\[assaut\] window ready|globalShortcut.register|App threw|ELIFECYCLE" "$ASSAUT_LOG" 2>/dev/null; do
  if (( SECONDS > deadline )); then
    fail "assaut did not boot within 90 s"; tail -20 "$ASSAUT_LOG"; exit 1
  fi
  sleep 1
done
if grep -qE "App threw|ELIFECYCLE" "$ASSAUT_LOG"; then
  fail "assaut crashed during boot"
  tail -25 "$ASSAUT_LOG"
  exit 1
fi
ok "assaut window is up (green dot should be visible)"

# ---------- 5. Open browser tabs ----------
step "5. Opening browser tabs"
# Windows-friendly: `start` via cmd.exe; falls back to xdg-open / open.
opener=""
if command -v cmd.exe >/dev/null 2>&1; then opener="cmd.exe /c start"
elif command -v xdg-open >/dev/null 2>&1; then opener="xdg-open"
elif command -v open >/dev/null 2>&1;     then opener="open"
fi
if [[ -n "$opener" ]]; then
  $opener "$GH_ACTIONS_URL"  >/dev/null 2>&1 && ok "opened GitHub Actions"
  sleep 1
  $opener "$DIAG_URL"        >/dev/null 2>&1 && ok "opened /diag"
  sleep 1
  if [[ -f "$PDF_PATH" ]]; then
    $opener "$PDF_PATH" >/dev/null 2>&1 && ok "opened handoff PDF"
  else
    warn "handoff PDF missing at $PDF_PATH"
  fi
else
  warn "no opener available — open these manually:"
  printf '    %s\n    %s\n    %s\n' "$GH_ACTIONS_URL" "$DIAG_URL" "$PDF_PATH"
fi

# ---------- 6. Tail both logs ----------
step "6. Demo ready. Tailing server + assaut logs (Ctrl-C to exit)"
printf '  Server log: %s\n  Assaut log: %s\n  PIDs:       server=%s assaut=%s\n\n' \
  "$SERVER_LOG" "$ASSAUT_LOG" "$SERVER_PID" "$ASSAUT_PID"
tail -F "$SERVER_LOG" "$ASSAUT_LOG"
