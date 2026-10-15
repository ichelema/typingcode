# TypingMind tool viewer extension

Estensione TypingMind che mostra in un pannello il viewer locale degli output dei tool
(`http://127.0.0.1:8765/`). Contiene solo interfaccia: nessun segreto.
Fa parte del repo `typingcode`; il bundle pubblicato è `dist/ext.js` nella radice del progetto.

## Struttura

| Percorso | Ruolo |
|---|---|
| `src/main.js` | punto di ingresso: eventi, avvio, cleanup |
| `src/config.js` | costanti |
| `src/sig.js` | funzioni pure (abbinamento chiamata/chat, stessa formula del viewer Python) |
| `src/util.js` | log, statistiche, localStorage |
| `src/db.js` | lettura della chat da IndexedDB (sola lettura) |
| `src/style.js` | CSS e icone |
| `src/state.js` | stato condiviso tra i moduli |
| `src/view.js` | tema, intestazione, messaggi al viewer |
| `src/sync.js` | sincronizzazione con il viewer e controllo che risponda |
| `src/ui.js` | pulsante e pannello |
| `../../dist/ext.js` | bundle minificato nella radice del progetto (generato da `script/build.mjs`, committato: è il file servito dalla CDN) |

## Comandi

```bash
# da src/extension
bun test                        # test delle funzioni pure
# dalla radice del progetto
bun script/build.mjs            # src/extension/src/ -> dist/ext.js (+ ext.js.map)
bun script/build.mjs --watch    # ricompila a ogni modifica
bash script/publish.sh "msg"    # test + build + commit + push del progetto, stampa gli URL fissati al commit
```

Durante lo sviluppo il viewer locale serve il bundle anche su `http://127.0.0.1:8765/ext.js`.
