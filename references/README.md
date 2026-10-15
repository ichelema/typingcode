# references

Repository di riferimento per sviluppare estensioni JavaScript per [TypingMind](https://www.typingmind.com/).
Sono solo copie da studiare: non si modificano qui.

| Cartella | Origine | Contenuto | Licenza |
|---|---|---|---|
| `typingmind/` | [TypingMind/typingmind](https://github.com/TypingMind/typingmind) | Build compilata e minificata (export statico Next.js) della versione self-host. Nessun sorgente. | Proprietaria: deploy e uso consentiti, modifica e ridistribuzione vietate |
| `typingmind-extensions/` | [augustx28/typingmind-extensions](https://github.com/augustx28/typingmind-extensions) | 25 estensioni della community (UI, export, sync, outline) | Nessuna licenza dichiarata: solo studio, non copiare codice |
| `typingmind-contentshield/` | [itcon-pty-au/typingmind-contentshield](https://github.com/itcon-pty-au/typingmind-contentshield) | Un'estensione che segnala dati sensibili nell'input della chat | MIT |

## Come TypingMind carica le estensioni

Documentazione ufficiale: <https://docs.typingmind.com/typingmind-extensions>

- Si installano da **Preferences → Advanced Settings → Extensions** inserendo l'URL di un file `.js`.
- L'app crea un tag `<script async>` per ogni URL all'avvio. Lo script gira nella pagina, senza un oggetto API dedicato.
- Il file deve essere servito come `application/javascript` o `text/javascript` e con CORS corretto, altrimenti il browser lo blocca (`net::ERR_BLOCKED_BY_ORB`).
- Le estensioni si caricano solo all'avvio: dopo ogni modifica ricaricare la pagina.
- `?safe_mode=1` nell'URL avvia l'app senza estensioni (per rimuovere un'estensione che rompe l'app).

Punti di aggancio disponibili:

| Punto di aggancio | Note |
|---|---|
| DOM via `data-element-id` | ~185 id nella build attuale (es. `chat-input-textbox`, `ai-response`, `user-message`, `workspace-tab-settings`). Possono cambiare tra versioni. |
| `MutationObserver` | Necessario: React ricrea gli elementi, l'estensione deve riagganciarsi. |
| `localStorage` | Impostazioni; chiavi `TM_*` non documentate. Va bene per salvare la config dell'estensione. |
| IndexedDB | Chat e messaggi. Schema non documentato: leggere sì, scrivere solo con test accurati. |
| `window.fetch` | Wrapper per leggere o modificare le chiamate ai modelli. Non dipende dal codice interno. |

I nomi interni del bundle minificato (`e7`, `ew`, ...) cambiano a ogni build: usare il bundle solo per capire il comportamento, mai per chiamare funzioni interne.

## Catalogo `typingmind-extensions`

| File | Cosa fa | Punti di aggancio usati |
|---|---|---|
| `chat-space.js` | Space Saver v4.5.1: compatta l'area chat | DOM, `MutationObserver`, `localStorage` |
| `darktheme-pc.js`, `darktheme-phone.js` | Tema scuro desktop / mobile | CSS iniettato, `MutationObserver` |
| `export-md.js` | Chat Export v1.3.4: esporta la chat aperta in Markdown | DOM, IndexedDB, `localStorage` |
| `font-colors.js` | Colori delle risposte AI configurabili | CSS |
| `grey-buttons.js`, `hover.js`, `image.js`, `input.js`, `menu.js`, `models-menu.js`, `text.js` | Piccoli ritocchi grafici | CSS, a volte `MutationObserver` |
| `highlighter.js` | Persistent Highlighter v3.4.1: evidenziazioni persistenti nei messaggi | DOM, IndexedDB, `localStorage` |
| `nobranding.js` | Rimuove logo e titolo dalla home | `MutationObserver` |
| `nullkeyboard.js` | Evita che la tastiera mobile si apra da sola | `MutationObserver` |
| `outlines.js` (v5.4), `outlines2.js` (v4.8), `outlines3.js` (v5.3) | Pannello con l'indice dei titoli delle risposte (Ctrl/Cmd+Shift+O) | DOM, `localStorage` |
| `output.js` | Output Lock v1.0: ricorda le Output Settings (lingua, tono, stile) | DOM, `localStorage` |
| `plugins.js` | Plugin Sorter V14: riordina i plugin con drag | `localStorage`, `MutationObserver` |
| `scroll.js` | Scroll Memory v2: riapre ogni chat dove era rimasta | DOM, `localStorage` |
| `sidebar.js` | Sidebar Pin: tiene la sidebar aperta | DOM, `MutationObserver` |
| `sync.js`, `sync-v10.js` | Drive Sync v1.5.2: sync su Google Drive con blob content-addressed (SHA-256) | IndexedDB, `localStorage` |
| `tweaks.js` | Pannello di personalizzazione (sidebar, colori dei messaggi) | DOM, `localStorage` |

Esempi da studiare per tema:

- **Leggere le chat (IndexedDB):** `export-md.js`, `sync.js`
- **Aggiungere UI nelle impostazioni:** `tweaks.js`, `sync.js` (`workspace-tab-settings`)
- **Agire sull'input della chat:** `typingmind-contentshield/contentshield.js`, `nullkeyboard.js`
- **Configurazione salvata in `localStorage`:** `output.js`, `scroll.js`, `typingmind-contentshield/contentshield.js`

## Aggiornare

```bash
for d in typingmind typingmind-extensions typingmind-contentshield; do git -C "$d" pull --ff-only; done
```

Per vedere cosa è cambiato nella build di TypingMind (es. `data-element-id` rinominati):

```bash
git -C typingmind diff HEAD~1 --stat
```
