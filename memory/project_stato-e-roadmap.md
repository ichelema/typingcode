---
name: stato-e-roadmap
description: stato al 2026-10-15 (estensione 0.4.1 in uso, 0.6.0 di ICH-180 provata e pubblicata, proxy v7, connettore MCP di debug, profilo di debug in D:, C:\Download\test da eliminare) e prossimi passi: URL 0.6.0, decisione su log e viewer, ICH-179, ICH-181
metadata:
  type: project
---

# Stato (2026-10-15)

| Elemento | Stato |
|---|---|
| Estensione TypingMind | **0.4.1** in uso, URL in [estensione](reference_estensione.md). **0.6.0** (ICH-180) provata nel Chrome di debug e pubblicata (commit `077f3c7`, URL in [estensione](reference_estensione.md)); misure nel commento di ICH-180 |
| Proxy | `src/mcp/mcp_proxy.py` **v7**: log in `logs/`, regole da `src/mcp/core-behavior.md`, riduzione di Edit/Write, blocco dei comandi distruttivi. Lo avvia il connettore MCP di TypingMind |
| Viewer | `src/mcp/log_viewer.py` su `http://127.0.0.1:8765`, filtro per firma, `/ext.js` = `dist/ext.js` |
| Repo | `ichelema/typingcode`, pubblico, con tutto il progetto; `references/` come submodule |
| Chrome di debug | porta 9222, profilo `test/tm-inspect/chrome-profile`; si apre con `bash script/chrome-debug.sh`, che avvia anche il connettore MCP di debug su 50881. Dal 15/10 07:48 usa il profilo di `D:` (copiato da `C:` con connettore 50881, 3 server MCP e plugin attivi per le chat; controllo: `/clients` risponde 200 con 3 client). Il profilo di `D:` delle 06:43 è in `backups/chrome-profile-0643`. `C:\Download\test` non serve più: l'utente la elimina |
| TypingMind | riassunto automatico del contesto attivato dall'utente nel browser normale |
| Claude Code | 2.1.300 (il test degli hook in [scoperte](reference_scoperte.md) era sulla 2.1.299) |
| Linear (team `ICH`, progetto **Typingcode**, fino al 15/10 "Typingmind") | aperte ICH-179, ICH-180 e ICH-181; ICH-175 … ICH-178 (0.5.0) Canceled |

Pid e orari dei processi cambiano a ogni avvio: trovali con i comandi in [comandi](reference_comandi.md).

# Prossimi passi (in ordine)

1. **ICH-180**: 0.6.0 fatta e provata nel Chrome di debug (criteri e misure nella issue). Manca la
   prova nel browser dell'utente: URL githack della 0.6.0 al posto di quello della 0.4.1.
2. Dopo la prova: decidere se togliere da `mcp_proxy.py` la parte di log (`write(LOG…)`, `META`,
   rotazione, variabili `MCP_PROXY_LOG/KEEP/KEEP_META/MAX_MB/ROTATE_EVERY/NO_VIEWER`) e l'avvio del
   viewer (`ensure_viewer`), e se `log_viewer.py` serve ancora. Il log dà ancora: output completo di
   Edit/Write, `pid`/`started` del proxy, chiamate di chat eliminate o compattate. Le regole, la
   riduzione di Edit/Write e il blocco dei comandi distruttivi restano (`pending` serve alla riduzione).
3. **ICH-179**: ricontrollare gli hook `PreToolUse`/`PostToolUse` con `claude mcp serve` sulla
   versione attuale di Claude Code (ultimo test sulla 2.1.299).
4. **ICH-181**: percorsi relativi alla radice del progetto e supporto Linux per proxy, viewer,
   `chrome-debug.sh` e `cdp.mjs` (oggi funzionano solo in `D:\Sviluppo\Progetti\typingcode` su Windows; su Linux il
   viewer non parte, senza avvisi). Risolve anche il limite del worktree per ICH-180.
5. Idee opzionali: "errore" nel pannello solo per i fallimenti veri (oggi un Bash con stderr non vuoto
   conta come errore); stato aperto/chiuso delle chiamate conservato al cambio chat; filtri per tool e
   stato (c'erano nel viewer, tolti nella 0.6.0); disegno a blocchi se il costo dell'accessibilità di
   Chrome si vede anche nel browser dell'utente.
