---
name: estensione
description: repo typingcode, URL githack in uso (9fde5d3), pubblicazione, versioni 0.1–0.5.0, filtro per chat con firma, diagnostica ed emergenza
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
- **URL in uso (v0.4.1, verificato il 15/10: HTTP 200, `application/javascript`, CORS `*`, identico a `dist/ext.js`):**
  ```
  https://rawcdn.githack.com/ichelema/typingcode/9fde5d3a159c8397f6e5e0d29c4e7ee8c6f0c9c4/dist/ext.js
  ```
  jsDelivr risponde 503 per i commit nuovi: usare githack. Installazione: Preferences → Advanced
  Settings → Extensions → sostituire l'URL vecchio → ricaricare (F5).
- Versioni:
  - 0.1: riquadro + avviso offline
  - 0.2.0: filtro per chat — **rileggeva la chat ogni 3 s → blocchi di Chrome**
  - 0.3.0: niente letture periodiche; legge la chat solo al cambio chat, scheda di nuovo visibile,
    caricamento del viewer, chiamate nuove non ancora nella chat (max 3 tentativi: 1,5/3/6 s)
  - 0.4.0: pulsante nella barra della chat + pannello laterale (ridimensionabile, alternativo al
    pannello nativo "About this chat") + tema chiaro/scuro seguito dal vivo
  - **0.4.1 (in uso)**: codice diviso in moduli (`src/extension/src/`) + bundle minificato `dist/ext.js`
  - 0.5.0 (annullata il 15/10): un processo MCP per chat; chiamate delle chat in background al
    processo sbagliato (ICH-178)
- Diagnostica in console: `window.__toolviewer_stats` → `reads`, `lastMs`, `maxMs`, `lastAt`.
- Emergenza: `https://www.typingmind.com/?safe_mode=1` carica TypingMind senza estensioni.

## Come funziona il filtro per chat

- Id chat dall'URL `#chat=<id>` → chiave IndexedDB `keyval-store` / `keyval` / `CHAT_<id>`.
- Le chiamate stanno in `messages[i].tool_calls[0].function.arguments` (stringa JSON) e
  `messages[i].pluginResponse.inputParams`.
- Chiave di abbinamento = `JSON.stringify([command, description || ""])` per Bash, JSON degli argomenti
  con chiavi ordinate per gli altri tool (stessa formula in Python `sig()` e JS `sigOf()`).
- Limite: due chat con lo stesso comando e la stessa descrizione vedono entrambe la chiamata. Le
  chiamate delle chat in background vanno invece nella chat giusta, perché TypingMind le salva nella
  chat che le ha generate.
