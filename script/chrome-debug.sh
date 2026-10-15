#!/usr/bin/env bash
# Avvia il Chrome di debug (porta 9222) con il profilo di test/tm-inspect/chrome-profile e apre TypingMind.
# Serve a cdp.mjs e al server MCP "playwright" (--cdp-endpoint http://127.0.0.1:9222). Uso: bash script/chrome-debug.sh
# Avvia anche il connettore MCP del profilo di debug sulla porta 50881 (la 50880 e' del browser normale).
set -euo pipefail

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PORT=9222
ROOT=$(cd "$(dirname "$0")/.." && pwd)
PROFILE=$(cygpath -m "$ROOT/test/tm-inspect/chrome-profile")   # Chrome vuole un percorso Windows

MCP_PORT=50881                                    # TypingMind cerca il connettore su 50880 e 50881
TOKEN_FILE="$ROOT/test/tm-inspect/mcp-token"      # token del profilo di debug: fuori da git (repo pubblico)
if curl -s -o /dev/null "http://127.0.0.1:$MCP_PORT/"; then
  echo "PASS connettore MCP di debug gia' attivo sulla porta $MCP_PORT"
elif [ -s "$TOKEN_FILE" ]; then
  mkdir -p "$ROOT/logs"
  # PATH utente di Windows, come il connettore del browser normale: i server con il solo nome del comando
  # (es. rust-mcp-filesystem.exe in C:\Appl\bin) non partono con il PATH strict di MSYS2.
  WINPATH=$(reg query 'HKCU\Environment' //v Path | tr -d '\r' | awk '/REG_/ { sub(/.*REG_[A-Z_]*SZ +/, ""); print }')
  # Token nella variabile MCP_AUTH_TOKEN (letta da @typingmind/mcp), non nella riga di comando.
  # HOSTNAME = indirizzo di ascolto del connettore: la shell MSYS2 lo esporta con il nome del PC.
  HOSTNAME=127.0.0.1 PATH="$PATH:$(cygpath -p "$WINPATH")" PORT=$MCP_PORT MCP_AUTH_TOKEN=$(<"$TOKEN_FILE") \
    nohup npx -y @typingmind/mcp >>"$ROOT/logs/mcp-connector-debug.log" 2>&1 &
  disown
  echo "Avvio connettore MCP di debug sulla porta $MCP_PORT (log: logs/mcp-connector-debug.log)"
else
  echo "Attenzione: manca $TOKEN_FILE (token mostrato da TypingMind > MCP nel profilo di debug): connettore non avviato"
fi

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
