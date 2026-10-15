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
| `test/calls.test.js` | test di `callsFromChat` su `test/chat-sample.json` (struttura reale, contenuti anonimi) |
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
