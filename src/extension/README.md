# TypingMind tool viewer extension

Estensione TypingMind che mostra in un pannello laterale le chiamate ai tool della chat aperta
(nome, input, output, durata; diff per Edit/Write), di tutti i server MCP. I dati vengono dalla chat
salvata da TypingMind in IndexedDB, in sola lettura: niente log del proxy, niente viewer locale.
Contiene solo interfaccia: nessun segreto.
Fa parte del repo `typingcode`; il bundle pubblicato è `dist/ext.js` nella radice del progetto.

La chat si rilegge solo su segnale: apertura del pannello, cambio chat, scheda di nuovo visibile,
pulsante Ricarica, salvataggio della chat aperta (osservato su `IDBObjectStore.put`).
La lista sta in uno shadow root con `data-sentry-block`: le altre estensioni non la elaborano e la
registrazione di sessione di TypingMind (Sentry Replay) non registra gli output dei tool.

**Svuota lista** (0.6.2) nasconde le chiamate mostrate nella chat aperta, senza cancellare dati
in IndexedDB. Le nuove chiamate continuano a comparire; quelle nascoste, anche se ancora in corso,
restano nascoste con Ricarica, chiudi/riapri e cambio chat. Lo stato è separato per chat e dura
fino a F5, che ripristina la lista completa.

**Cartella di lavoro per chat** (0.7.0): il pulsante 📁 nella barra dei pulsanti del prompt
associa una cartella alla chat aperta (salvata in `localStorage`, chiave `toolviewer_workdirs`).
Serve il plugin MCP custom `src/mcp/claude_code.plugin.json` (env `TM_CHAT_ID: "{chatID}"`, che
TypingMind sostituisce con la chat che genera) e `mcp_proxy.py` v8. `route.js` intercetta `fetch`
verso il connettore: serializza la coppia `/start` → `/clients/<id>/call_tools|tools` per id
statico e la manda a un processo per chat (`<id>__<chat>`) con `MCP_PROXY_CWD`. Senza `/start`
appaiato, o senza id chat, la chiamata viene rifiutata; il proxy blocca le chiamate non instradate
o con cartella non valida. Non è un sandbox: percorsi assoluti fuori cartella restano possibili.

## Struttura

| Percorso | Ruolo |
|---|---|
| `src/main.js` | punto di ingresso: eventi, avvio, cleanup |
| `src/config.js` | costanti |
| `src/calls.js` | funzioni pure: chiamate ai tool da una chat (`callsFromChat`), id della chat, larghezza |
| `src/util.js` | log, statistiche (`window.__toolviewer_stats`), localStorage |
| `src/db.js` | lettura della chat da IndexedDB (sola lettura) e segnale dei salvataggi |
| `src/style.js` | CSS del pannello, CSS della lista (shadow root) e icone |
| `src/state.js` | stato condiviso tra i moduli |
| `src/view.js` | tema, intestazione, card delle chiamate |
| `src/sync.js` | lettura della chat e disegno, solo su segnale |
| `src/ui.js` | pulsante e pannello |
| `src/route.js` | instradamento per chat delle chiamate al connettore MCP, cartelle per chat |
| `src/workdir.js` | pulsante cartella nella barra del prompt |
| `test/calls.test.js` | test di `callsFromChat` su `test/chat-sample.json` (struttura reale, contenuti anonimi) |
| `test/route.test.js` | test dell'instradamento con connettore finto (chat concorrenti, blocchi, timeout) |
| `../../dist/ext.js` | bundle minificato nella radice del progetto (generato da `script/build.mjs`, committato: è il file servito dalla CDN) |

## Comandi

```bash
# da src/extension
bun test                        # test delle funzioni pure
# dalla radice del progetto
bun script/build.mjs            # src/extension/src/ -> dist/ext.js (+ ext.js.map)
bun script/build.mjs --watch    # ricompila a ogni modifica
git config core.hooksPath script/hooks   # una volta: pre-commit (test + build) e pre-push (URL githack)
```

Prova senza pubblicare, nel Chrome di debug (`bash script/chrome-debug.sh`):

```bash
node test/tm-inspect/cdp.mjs eval "window.__toolviewer_cleanup && window.__toolviewer_cleanup()"
node test/tm-inspect/cdp.mjs evalfile D:/Sviluppo/Progetti/typingcode/dist/ext.js   # dopo un F5 torna la versione installata
```
