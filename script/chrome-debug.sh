#!/usr/bin/env bash
# Avvia il Chrome di debug (porta 9222) con il profilo di test/tm-inspect/chrome-profile e apre TypingMind.
# Serve a cdp.mjs e al server MCP "playwright" (--cdp-endpoint http://127.0.0.1:9222). Uso: bash script/chrome-debug.sh
set -euo pipefail

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PORT=9222
PROFILE=$(cygpath -m "$(cd "$(dirname "$0")/.." && pwd)/test/tm-inspect/chrome-profile")   # Chrome vuole un percorso Windows

if curl -fs -o /dev/null "http://127.0.0.1:$PORT/json/version"; then
  echo "PASS Chrome di debug gia' attivo sulla porta $PORT (nessuna seconda istanza: bloccherebbe il profilo)"; exit 0
fi
[ -x "$CHROME" ] || { echo "FAIL Chrome non trovato: $CHROME"; exit 1; }
[ -d "$PROFILE" ] || echo "Attenzione: profilo assente, Chrome ne crea uno nuovo (senza login TypingMind): $PROFILE"

echo "Avvio Chrome di debug: porta $PORT, profilo $PROFILE"
"$CHROME" --remote-debugging-port="$PORT" --remote-debugging-address=127.0.0.1 --user-data-dir="$PROFILE" \
  https://www.typingmind.com/ >/dev/null 2>&1 &
disown

for _ in $(seq 1 20); do
  if curl -fs -o /dev/null "http://127.0.0.1:$PORT/json/version"; then echo "PASS Chrome di debug pronto su http://127.0.0.1:$PORT"; exit 0; fi
  sleep 0.5
done
echo "FAIL la porta $PORT non risponde dopo 10 s"; exit 1
