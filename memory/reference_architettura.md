---
name: architettura
description: TypingMind → connettore @typingmind/mcp :50880 → mcp_proxy.py → claude mcp serve; viewer :8765; config del server claude_code; variabili MCP_PROXY_*; API del connettore
metadata:
  type: reference
---

# Architettura e configurazione MCP

```
TypingMind (browser)
  └─ connettore @typingmind/mcp 1.4.1 su :50880  (avviato da start_typingmind_mcp.ahk, systray)
       └─ server "claude_code": env.exe → zsh -l → python3 src/mcp/mcp_proxy.py claude mcp serve
            ├─ inoltra tutto a `claude mcp serve` (gli strumenti dell'assistente)
            ├─ registra ogni tools/call in D:\Sviluppo\Progetti\typingcode\logs\proxy_log.jsonl
            └─ all'avvio lancia il viewer se la porta 8765 è libera

src/mcp/log_viewer.py  →  http://127.0.0.1:8765  (pagina live + /log + /ext.js)
estensione TypingMind 0.6.x (in uso dal 15/10, `dist/ext.js` su githack, repo `ichelema/typingcode`) →
   pannello laterale che disegna le chiamate direttamente dalla chat in IndexedDB: non usa né il log né il viewer
   (fino alla 0.4.1: viewer in un iframe, filtrato per firma sulle chiamate della chat aperta)

Chrome di debug (porta 9222) → connettore di debug @typingmind/mcp su 127.0.0.1:50881 (avviato da
   script/chrome-debug.sh, token in test/tm-inspect/mcp-token, fuori da git) → stessi server MCP
```

## Cartella per chat (0.7.0, proxy v8)

```
TypingMind (plugin MCP custom, env TM_CHAT_ID="{chatID}")
  └─ estensione route.js: /start + call_tools serializzati per id statico → id "<statico>__<chat>",
     env TM_ROUTED=1 e MCP_PROXY_CWD (cartella scelta col pulsante 📁)
       └─ connettore: un processo per chat → env.exe → zsh → mcp_proxy.py (Popen cwd=cartella) → claude mcp serve
```

Proxy v8: con `TM_CHAT_ID` senza `TM_ROUTED=1`, o con cartella non assoluta/inesistente, ogni
`tools/call` riceve un errore (fail-closed); `/d/x` diventa `d:/x`; log `proxy_log_<chat>.jsonl`.
Senza `TM_CHAT_ID` (vecchio JSON MCP) il comportamento è invariato. Cartella predefinita delle
chat senza 📁: `env.exe -C /d/AI/Claude/Trinity` nel plugin (decisa dall'utente il 13/11). Il connettore unisce `env`
alla sua env predefinita (`getDefaultEnvironment()` + env). Cambio cartella = config diversa =
il connettore riavvia il processo di quella chat. Proxy v9: con `TM_CHAT_ID` termina dopo
`MCP_PROXY_IDLE_MIN` (30) minuti senza messaggi e senza chiamate in corso; il connettore tiene la voce
morta (non rileva la fine del processo, `/start` con la stessa config non fa nulla, `call_tools` → 500
"Not connected"), quindi l'estensione fa `DELETE /clients/<id>` prima di riusarla (29 min) e alla
cancellazione della chat.

## Configurazione MCP del server `claude_code`

Ultimo argomento (percorso cambiato il 15/10: `mcp_proxy.py` è in `src/mcp/`):

```
export PATH="$HOME/.local/bin:$PATH"; exec python3 D:/Sviluppo/Progetti/typingcode/src/mcp/mcp_proxy.py claude mcp serve 2>>/e/AI/Claude/mcp_claude_err.log
```

Il server `playwright` usa `--cdp-endpoint http://127.0.0.1:9222` (Chrome di debug) e
`--output-dir D:/Sviluppo/Progetti/typingcode/test/tm-inspect/playwright-out`.

Variabili opzionali (come `NOME=valore` negli args di env.exe, prima di zsh.exe):
- `MCP_PROXY_NO_VIEWER=1` → il proxy non avvia il viewer
- `MCP_PROXY_KEEP` (default 500), `MCP_PROXY_KEEP_META` (200), `MCP_PROXY_MAX_MB` (5), `MCP_PROXY_ROTATE_EVERY` (25)
- `MCP_PROXY_LOG` → percorso del log; `MCP_PROXY_RULES` → file delle regole; `MCP_PROXY_NO_HINTS=1`,
  `MCP_PROXY_NO_SLIM=1`, `MCP_PROXY_NO_GUARD=1` → disattivano regole, riduzione e guardia

## API del connettore (`lib/server.js`, verificata il 15/10)

- La pagina chiama il connettore con `fetch`: `POST /start` `{mcpServers: {<serverID>: {command, args, env}}}`
  e `POST /clients/<serverID>/call_tools` `{name, arguments}`. Il `serverID` di un server del JSON MCP
  è la sua chiave (`claude_code`), uguale per tutte le chat.
- `/start` con un `serverID` nuovo avvia un processo; con la stessa configurazione non fa niente; con
  una configurazione diversa riavvia il processo.
- Il connettore toglie un client dalla sua lista **solo** con `DELETE /clients/<id>`: se il processo
  termina da solo, la voce resta e le chiamate a quel `serverID` falliscono.
- Nella lista dei server di TypingMind il pulsante elimina compare solo per i server **non** presenti
  nel JSON.
