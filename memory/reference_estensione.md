---
name: estensione
description: repo typingcode, URL githack in uso (9fde5d3, 0.4.1), pubblicazione, versioni 0.1–0.6.0, funzionamento della 0.6.0 (chiamate dalla chat in IndexedDB), prova senza pubblicare, diagnostica ed emergenza
metadata:
  type: reference
---

# Estensione TypingMind

- Repo pubblico: `https://github.com/ichelema/typingcode` (tutto il progetto). Il vecchio repo
  `tm-tool-viewer-ext-tmp` è eliminato, con la cronologia delle versioni fino alla 0.5.0.
- Pubblicazione: commit e push con git, gestiti dall'utente. L'hook `pre-commit` esegue test e build
  quando il commit tocca `src/extension/` e blocca il commit se `dist/` non è aggiornato; l'hook
  `pre-push` stampa l'URL githack del commit quando il push cambia `dist/ext.js`, più il comando per
  controllarlo (`script/hooks/`, attivi con `core.hooksPath`).
- **URL in uso (v0.6.1, commit `811cc0c`, verificato il 15/10: HTTP 200, `application/javascript`,
  CORS `*`, identico a `dist/ext.js`)**, installato dall'utente il 15/10 nel browser normale e nel
  Chrome di debug:
  ```
  https://rawcdn.githack.com/ichelema/typingcode/811cc0c9eb2d279a753ec4e1d3202f3b70399b6f/dist/ext.js
  ```
  Ritorno alla 0.4.1 (iframe del viewer, serve il viewer su :8765):
  `https://rawcdn.githack.com/ichelema/typingcode/9fde5d3a159c8397f6e5e0d29c4e7ee8c6f0c9c4/dist/ext.js`
  jsDelivr risponde 503 per i commit nuovi: usare githack. Installazione: Preferences → Advanced
  Settings → Extensions → sostituire l'URL vecchio → ricaricare (F5). Dopo il cambio dell'URL serve F5:
  fino ad allora la pagina esegue la versione vecchia.
- Versioni:
  - 0.1: riquadro + avviso offline
  - 0.2.0: filtro per chat — **rileggeva la chat ogni 3 s → blocchi di Chrome**
  - 0.3.0: niente letture periodiche; legge la chat solo al cambio chat, scheda di nuovo visibile,
    caricamento del viewer, chiamate nuove non ancora nella chat (max 3 tentativi: 1,5/3/6 s)
  - 0.4.0: pulsante nella barra della chat + pannello laterale (ridimensionabile, alternativo al
    pannello nativo "About this chat") + tema chiaro/scuro seguito dal vivo
  - 0.4.1: codice diviso in moduli (`src/extension/src/`) + bundle minificato `dist/ext.js`
  - 0.5.0 (annullata il 15/10): un processo MCP per chat; chiamate delle chat in background al
    processo sbagliato (ICH-178)
  - 0.6.0 (15/10, ICH-180, commit `077f3c7`): niente iframe, viewer e log; chiamate di tutti i server
    MCP lette dalla chat in IndexedDB. **Difetto**: con il pannello aperto prima di un F5 il pannello
    restava vuoto (all'avvio nasce dopo la prima lettura); non visto nelle prove perché il bundle era
    caricato in una pagina già pronta
  - **0.6.1 (15/10, commit `811cc0c`)**: il pannello appena creato si riempie (`ensurePanel` → `sync`).
    Prova di avvio reale: bundle come init script di Playwright + `page.reload()` (pannello con 163 card)
- Diagnostica in console: `window.__toolviewer_stats` → `reads`, `lastMs`, `maxMs`, `lastAt` (dalla
  0.6.0: lettura + estrazione, tempo totale compresa l'attesa se la pagina è occupata).
- Emergenza: `https://www.typingmind.com/?safe_mode=1` carica TypingMind senza estensioni.
- Prova senza pubblicare (Chrome di debug): `cdp.mjs eval "window.__toolviewer_cleanup()"`, poi
  `cdp.mjs evalfile D:/Sviluppo/Progetti/typingcode/dist/ext.js`; dopo un F5 torna la versione installata.

## Come funziona la 0.6.0

- Id chat dall'URL `#chat=<id>` → chiave IndexedDB `keyval-store` / `keyval` / `CHAT_<id>`, sola lettura.
- `callsFromChat()` (`src/calls.js`): una voce per `tool_calls[].id`; output, errore e durata dal
  messaggio `role: "tool"` con lo stesso `tool_call_id`; senza risposta = "in corso". Bash: `stdout` e
  `stderr` separati. Edit/Write: diff da `structuredPatch`; Write `create` con contenuto omesso dal
  proxy → righe dagli argomenti della chiamata. Errore = `format: "error"`, `stderr` non vuoto,
  `interrupted`, o testo `Exit code N` / `Tool … input is invalid` / `<tool_use_error>` / `### Error`.
- Letture solo su segnale: apertura del pannello, cambio chat, scheda visibile, Ricarica, `put` della
  chat aperta (debounce 500 ms). I salvataggi delle chat in background non toccano il pannello.
- Card riusate per `tool_call_id`: a ogni lettura si ricreano solo le card nuove o appena finite; il
  corpo di una card si costruisce alla prima apertura.
- Lista in uno shadow root con `data-sentry-block` (anche sul pannello): le altre estensioni non la
  elaborano, il CSS di TypingMind non la tocca, Sentry Replay non registra gli output.
- Misure (Chrome di debug, `ROa5e2T-v_`, 163 chiamate): lettura + estrazione 11–18 ms; disegno
  completo (apertura chat, Ricarica) = un task da 80–100 ms, di cui 72 ms accessibilità di Chrome; una
  chiamata nuova crea una sola card.
