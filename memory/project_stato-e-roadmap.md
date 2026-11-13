---
name: stato-e-roadmap
description: stato al 2026-11-13, ICH-180 e ICH-182 Done su richiesta utente; prove funzionali confermate, limiti documentati; decisione log/viewer, ICH-179 e ICH-181
metadata:
  type: project
---

# Ripresa verificata (2026-11-13)

- **0.6.2**: aggiunto «Svuota lista» nel pannello; nasconde solo le card della chat aperta,
  incluse quelle in corso, senza modificare IndexedDB. Nuove chiamate visibili; stato separato
  per chat fino a F5, conservato con Ricarica e chiudi/riapri. Test: 10 PASS, 35 asserzioni;
  prova nel Chrome di debug con 174 card superata e dati della chat invariati nei conteggi.
  Browser di debug ripristinato alla versione installata dopo la prova. Per usare il pulsante
  occorre installare l'URL githack del nuovo commit; 0.6.1 resta installata fino al cambio URL.

- Checkout attuale: `D:/Sviluppo/Progetti/Personali/20261015_typingcode`; i percorsi assoluti
  storici nelle memorie/script non sono stati migrati (ICH-181).
- ICH-180 e ICH-182 **Done** su richiesta esplicita dell'utente (13/11); commenti con esiti
  e limiti pubblicati su entrambe, stato riletto e confermato. `bun test`: 9 PASS, 23 asserzioni.
- Chrome di debug e connettore avviati con `script/chrome-debug.sh` dal checkout attuale.
  Script installato `811cc0c`, 0.6.1: dopo reload 163 card per 163 risposte tool, blocco Sentry presente.
- A pagina stabilizzata, Ricarica: una lettura, 32 ms; long task osservati in 3 s: 51 e 97 ms,
  senza attribuzione causale. All'avvio `lastMs` fino a 1.630 ms (tempo totale inclusa attesa).
  Non sono misure del browser normale.
- Il riassunto conserva la cronologia nel sorgente locale; evidenze e limiti in
  [scoperte](reference_scoperte.md). Nessun nuovo riassunto provocato, nessun prompt inviato.
- Conferma dell'utente (13/11 03:50), browser normale con 0.6.1 (`811cc0c`): dopo F5 le
  vecchie chiamate restano visibili e una nuova chiamata si aggiunge senza ricaricare.
- Successivamente l'utente conferma: separazione chat A/B, «in corso» → «ok», errore intenzionale
  riconosciuto, Playwright e filesystem_binary visibili, digitazione fluida nella chat lunga.
- Chiusura accettata senza prova prima/dopo un nuovo riassunto online, stato dell'accessibilità
  e misure quantitative nel browser normale; non dichiarati superati. Nessun ticket aggiuntivo.
- Errore MCP: l'utente stava usando il browser di debug e ha interrotto la diagnosi, confermando
  che nel browser normale il test funziona. Nessuna configurazione MCP modificata.
- ICH-179 verificata il 13/11 su Claude Code 2.1.323: controllo positivo con entrambi gli hook,
  nessun evento su MCP diretto/proxy con Bash riuscito. Dettagli in [scoperte](reference_scoperte.md).
  Esito pubblicato su Linear e stato **Done** riletto il 13/11 su autorizzazione dell'utente.
- Ricerca campo comandi/cartella nella sidebar (13/11): `/cd` è interattivo, non un tool MCP;
  nel test 2.1.323 il `cd` Bash non persiste alla chiamata successiva. Nessuna implementazione;
  prima chiarire se la cartella deve essere globale o per chat (server attuale condiviso).
  Evidenze e fonti in [scoperte](reference_scoperte.md).
- Cartella per chat: **0.7.0 + proxy v8 implementati e pubblicati** (dettagli in
  [estensione](reference_estensione.md) e [architettura](reference_architettura.md)). L'utente
  deve: installare l'URL 0.7.0, creare il plugin da `src/mcp/claude_code.plugin.json` (JSON
  editor, scheda MCP Connector con URL/token di :50880), togliere `claude_code` dal JSON MCP,
  provare due chat. 0.7.1: chiusura dopo 30 min di inattività e alla cancellazione della chat.
  Limite: aspetto del pulsante non verificato a vista.
- Prossimo: prova utente della cartella per chat; decisione su log/viewer, che restano invariati; ICH-181.

# Stato storico (2026-10-15)

| Elemento | Stato |
|---|---|
| Estensione TypingMind | **0.6.1** (ICH-180, `811cc0c`) installata dall'utente il 15/10 nel browser normale e nel Chrome di debug (nel debug controllato: script `811cc0c`, pannello pieno dopo F5 con 163 card). URL in [estensione](reference_estensione.md); misure nel commento di ICH-180 |
| Proxy | `src/mcp/mcp_proxy.py` **v7**: log in `logs/`, regole da `src/mcp/core-behavior.md`, riduzione di Edit/Write, blocco dei comandi distruttivi. Lo avvia il connettore MCP di TypingMind |
| Viewer | `src/mcp/log_viewer.py` su `http://127.0.0.1:8765`, filtro per firma, `/ext.js` = `dist/ext.js` |
| Repo | `ichelema/typingcode`, pubblico, con tutto il progetto; `references/` come submodule |
| Chrome di debug | porta 9222, profilo `test/tm-inspect/chrome-profile`; si apre con `bash script/chrome-debug.sh`, che avvia anche il connettore MCP di debug su 50881. Dal 15/10 07:48 usa il profilo di `D:` (copiato da `C:` con connettore 50881, 3 server MCP e plugin attivi per le chat; controllo: `/clients` risponde 200 con 3 client). Il profilo di `D:` delle 06:43 è in `backups/chrome-profile-0643`. `C:\Download\test` non serve più: l'utente la elimina |
| TypingMind | riassunto automatico del contesto attivato dall'utente nel browser normale |
| Claude Code | 2.1.300 (il test degli hook in [scoperte](reference_scoperte.md) era sulla 2.1.299) |
| Linear (team `ICH`, progetto **Typingcode**, fino al 15/10 "Typingmind") | aperte ICH-179, ICH-180, ICH-181 e ICH-182 (controlli della 0.6.x, collegata a ICH-180); ICH-175 … ICH-178 (0.5.0) Canceled |

Pid e orari dei processi cambiano a ogni avvio: trovali con i comandi in [comandi](reference_comandi.md).

# Prossimi passi (in ordine)

1. **ICH-180 e ICH-182 concluse** su richiesta dell'utente, con i limiti indicati sopra.
   Eventuali verifiche aggiuntive sul riassunto e sulle prestazioni non sono state eseguite.
2. Decidere se togliere da `mcp_proxy.py` la parte di log (`write(LOG…)`, `META`,
   rotazione, variabili `MCP_PROXY_LOG/KEEP/KEEP_META/MAX_MB/ROTATE_EVERY/NO_VIEWER`) e l'avvio del
   viewer (`ensure_viewer`), e se `log_viewer.py` serve ancora. Il log dà ancora: output completo di
   Edit/Write, `pid`/`started` del proxy, chiamate di chat eliminate (il riassunto nel sorgente locale non le elimina). Le regole, la
   riduzione di Edit/Write e il blocco dei comandi distruttivi restano (`pending` serve alla riduzione).
3. **ICH-179**: ricontrollo completato sulla 2.1.323; hook assenti su MCP diretto e proxy,
   controllo positivo riuscito. Esito registrato su Linear, issue **Done** (verifica conclusa,
   non risolto il limite di Claude Code).
4. **ICH-181**: percorsi relativi alla radice del progetto e supporto Linux per proxy, viewer,
   `chrome-debug.sh` e `cdp.mjs` (oggi funzionano solo in `D:\Sviluppo\Progetti\typingcode` su Windows; su Linux il
   viewer non parte, senza avvisi). Risolve anche il limite del worktree per ICH-180.
5. Idee opzionali: "errore" nel pannello solo per i fallimenti veri (oggi un Bash con stderr non vuoto
   conta come errore); stato aperto/chiuso delle chiamate conservato al cambio chat; filtri per tool e
   stato (c'erano nel viewer, tolti nella 0.6.0); disegno a blocchi se il costo dell'accessibilità di
   Chrome si vede anche nel browser dell'utente.
