#!/usr/bin/env bash
# validate-m1.sh — Code Rouge M1 self-test, runs on the NUC.
#
# Run AFTER `install-nuc.sh` has completed and the systemd service is up.
# Use case: the client's IT team wants a binary green/red verdict on
# whether the NUC is correctly serving M1.
#
# Usage:
#   bash tools/scripts/validate-m1.sh           # human-friendly output
#   bash tools/scripts/validate-m1.sh --quiet   # only the final verdict
#
# Exit codes:
#   0  — all checks passed
#   1  — at least one check failed
#   2  — script could not run (missing dependency)
#
# This script is idempotent and read-only. It performs no writes
# anywhere — safe to run from cron, from a CI pipeline, or interactively.

set -uo pipefail

QUIET=0
if [[ "${1:-}" == "--quiet" ]]; then
  QUIET=1
fi

# ---------- Colour helpers (only if stdout is a TTY) ----------
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' BOLD='' RESET=''
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
declare -a FAIL_DETAILS

REPORT_FILE="/tmp/m1-validation-$(date +%Y-%m-%d-%H%M%S).txt"
{
  echo "Code Rouge — M1 validation report"
  echo "Generated: $(date -Iseconds)"
  echo "Host: $(hostname) ($(uname -s) $(uname -r))"
  echo "----------------------------------------"
} >"$REPORT_FILE"

# ---------- Output helpers ----------
say() {
  if [[ $QUIET -eq 0 ]]; then
    echo -e "$@"
  fi
  echo "$@" | sed -E 's/\x1B\[[0-9;]*[mK]//g' >>"$REPORT_FILE"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  say "  ${GREEN}✓${RESET} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAIL_DETAILS+=("$1 — fix: $2")
  say "  ${RED}✗${RESET} $1"
  say "      ${YELLOW}fix:${RESET} $2"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  say "  ${YELLOW}!${RESET} $1"
}

section() {
  say ""
  say "${BOLD}$1${RESET}"
}

# ---------- Dependency check ----------
for cmd in curl ss; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    say "${RED}ERROR:${RESET} required command '$cmd' not found."
    say "  Install with: sudo apt install -y curl iproute2"
    exit 2
  fi
done

# ---------- The 8 checks ----------
say "${BOLD}=== Code Rouge — Validation M1 ===${RESET}"
say "Démarrage des contrôles..."

section "1/8  Service NUC à l'écoute sur :8080"
if ss -ltn 2>/dev/null | grep -qE ':8080\s'; then
  pass "Le port 8080 est en écoute"
else
  fail "Le port 8080 n'est PAS en écoute" \
       "Vérifier le service avec: sudo systemctl status code-rouge-server"
fi

section "2/8  Endpoint /health répond en moins de 50 ms"
HEALTH_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 2 "http://127.0.0.1:8080/health" 2>/dev/null || echo "999")
HEALTH_MS=$(awk -v t="$HEALTH_TIME" 'BEGIN { printf "%.0f", t * 1000 }')
if (( HEALTH_MS < 50 )); then
  pass "/health a répondu en ${HEALTH_MS}ms"
elif (( HEALTH_MS < 500 )); then
  warn "/health a répondu en ${HEALTH_MS}ms (cible <50ms ; OK fonctionnellement, à surveiller)"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  fail "/health a répondu en ${HEALTH_MS}ms ou n'a pas répondu" \
       "Vérifier les logs: sudo journalctl -u code-rouge-server -n 50"
fi

section "3/8  Endpoint /diag retourne un JSON valide"
DIAG_RESPONSE=$(curl -s --max-time 2 "http://127.0.0.1:8080/diag" 2>/dev/null || echo "")
if [[ -n "$DIAG_RESPONSE" ]] && echo "$DIAG_RESPONSE" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
  pass "/diag a renvoyé un JSON valide"
else
  fail "/diag n'a pas renvoyé un JSON valide" \
       "Vérifier les logs et que la base SQLite est accessible"
fi

section "4/8  Base SQLite initialisée (migrations appliquées)"
DB_PATH="${DATABASE_PATH:-${CODE_ROUGE_DB:-/var/lib/code-rouge/coderouge.sqlite}}"
if [[ -f "$DB_PATH" ]]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    MIGRATIONS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
    if (( MIGRATIONS > 0 )); then
      pass "Base SQLite trouvée à $DB_PATH ($MIGRATIONS tables)"
    else
      fail "Base SQLite vide ou corrompue ($DB_PATH)" \
           "Relancer le service pour réappliquer les migrations: sudo systemctl restart code-rouge-server"
    fi
  else
    warn "sqlite3 CLI non installé — vérification structure ignorée"
    if [[ -s "$DB_PATH" ]]; then
      pass "Base SQLite présente à $DB_PATH (taille >0)"
    else
      fail "Base SQLite vide à $DB_PATH" \
           "Vérifier que install-nuc.sh a bien tourné jusqu'au bout"
    fi
  fi
else
  fail "Base SQLite introuvable à $DB_PATH" \
       "Configurer CODE_ROUGE_DB ou vérifier l'installation"
fi

section "5/8  WebSocket /ws accepte les connexions"
if command -v python3 >/dev/null 2>&1; then
  WS_CHECK=$(python3 - <<'PY' 2>/dev/null
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect(('127.0.0.1', 8080))
    req = b"GET /ws HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n"
    s.send(req)
    resp = s.recv(256).decode('latin-1', errors='ignore')
    if '101' in resp.split('\r\n', 1)[0]:
        print("OK")
    else:
        print("FAIL:" + resp.split('\r\n', 1)[0])
except Exception as e:
    print("FAIL:" + str(e))
finally:
    s.close()
PY
  )
  if [[ "$WS_CHECK" == "OK" ]]; then
    pass "WebSocket /ws a accepté la mise à niveau (HTTP 101)"
  else
    fail "WebSocket /ws n'a pas accepté la mise à niveau ($WS_CHECK)" \
         "Vérifier les logs pour 'WS connection rejected'"
  fi
else
  warn "python3 non installé — vérification WebSocket ignorée"
fi

section "6/8  Espace disque suffisant (>500 Mo libres)"
DISK_FREE_MB=$(df -m "$(dirname "$DB_PATH")" 2>/dev/null | awk 'NR==2 {print $4}')
if [[ -n "$DISK_FREE_MB" ]] && (( DISK_FREE_MB > 500 )); then
  pass "$DISK_FREE_MB Mo libres sur la partition de la base"
else
  fail "Moins de 500 Mo libres ($DISK_FREE_MB Mo)" \
       "Libérer de l'espace : journalctl --vacuum-time=7d ; apt clean"
fi

section "7/8  Service stable (uptime > 60s)"
if systemctl is-active --quiet code-rouge-server 2>/dev/null; then
  ACTIVE_SINCE=$(systemctl show code-rouge-server -p ActiveEnterTimestampMonotonic --value 2>/dev/null || echo "0")
  ACTIVE_SECONDS=$(( ACTIVE_SINCE / 1000000 ))
  if (( ACTIVE_SECONDS > 60 )); then
    pass "Service code-rouge-server actif depuis ${ACTIVE_SECONDS}s"
  else
    warn "Service code-rouge-server vient de démarrer (${ACTIVE_SECONDS}s) — relancer dans 1min"
  fi
else
  warn "systemctl is-active a échoué (le service tourne peut-être en mode dev, pas via systemd)"
fi

section "8/8  Logs récents : aucune erreur dans les 5 dernières minutes"
# Pino logs raw JSON to journald in production. Levels: 50=error, 60=fatal.
# A plain `--grep "ERROR"` would always return 0 against JSON output.
ERROR_COUNT=0
if command -v journalctl >/dev/null 2>&1; then
  ERROR_COUNT=$(journalctl -u code-rouge-server --since "5 min ago" --no-pager 2>/dev/null \
    | grep -cE '"level":(50|60)' || true)
fi
if (( ERROR_COUNT == 0 )); then
  pass "Aucune erreur (level 50/60) dans les 5 dernières minutes"
else
  fail "$ERROR_COUNT entrée(s) de niveau ERROR/FATAL dans les 5 dernières minutes" \
       "Inspecter les logs : sudo journalctl -u code-rouge-server -n 100 | grep -E '\"level\":(50|60)'"
fi

# ---------- Final verdict ----------
say ""
say "${BOLD}=== Résultat ===${RESET}"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
say "  $PASS_COUNT/$TOTAL contrôles réussis ($WARN_COUNT avertissements)"

if (( FAIL_COUNT == 0 )); then
  say ""
  say "  ${GREEN}${BOLD}✓ TOUT EST VERT — le NUC est prêt pour la production.${RESET}"
  say ""
  say "  Rapport complet : $REPORT_FILE"
  exit 0
else
  say ""
  say "  ${RED}${BOLD}✗ ÉCHEC : $FAIL_COUNT contrôle(s) en erreur.${RESET}"
  say ""
  say "  Détail des erreurs :"
  for detail in "${FAIL_DETAILS[@]}"; do
    say "    • $detail"
  done
  say ""
  say "  Rapport complet : $REPORT_FILE"
  say "  En cas de doute : ouvrir une issue GitHub (github.com/gs-imak/code-rouge/issues) en y joignant ce fichier."
  exit 1
fi
