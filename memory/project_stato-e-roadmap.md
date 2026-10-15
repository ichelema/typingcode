---
name: stato-e-roadmap
description: stato al 2026-10-15 (estensione 0.4.1, proxy v7 in src/mcp, repo typingcode, Chrome di debug, Claude Code 2.1.300) e prossimi passi ICH-180, ICH-179
metadata:
  type: project
---

# Stato (2026-10-15)

| Elemento | Stato |
|---|---|
| Estensione TypingMind | **0.4.1**, URL in [estensione](reference_estensione.md) |
| Proxy | `src/mcp/mcp_proxy.py` **v7**: log in `logs/`, regole da `src/mcp/core-behavior.md`, riduzione di Edit/Write, blocco dei comandi distruttivi. Lo avvia il connettore MCP di TypingMind |
| Viewer | `src/mcp/log_viewer.py` su `http://127.0.0.1:8765`, filtro per firma, `/ext.js` = `dist/ext.js` |
| Repo | `ichelema/typingcode`, pubblico, con tutto il progetto; `references/` come submodule |
| Chrome di debug | porta 9222, profilo `test/tm-inspect/chrome-profile` (18 chat, estensione dal nuovo URL); si apre con `bash script/chrome-debug.sh` |
| TypingMind | riassunto automatico del contesto attivato dall'utente nel browser normale |
| Claude Code | 2.1.300 (il test degli hook in [scoperte](reference_scoperte.md) era sulla 2.1.299) |
| Linear (team `ICH`, progetto **Typingcode**, fino al 15/10 "Typingmind") | aperte ICH-179 e ICH-180; ICH-175 … ICH-178 (0.5.0) Canceled |

Pid e orari dei processi cambiano a ogni avvio: trovali con i comandi in [comandi](reference_comandi.md).

# Prossimi passi (in ordine)

1. **ICH-180**: prototipo del pannello che legge input, output e durata dei tool dalla chat in
   IndexedDB ([scoperte](reference_scoperte.md)), invece che da `logs/proxy_log.jsonl`. Si prova nel
   Chrome di debug.
2. Dopo ICH-180: decidere se togliere da `mcp_proxy.py` la parte di log e l'avvio del viewer, e se
   `log_viewer.py` serve ancora. Le regole, la riduzione di Edit/Write e il blocco dei comandi
   distruttivi restano.
3. **ICH-179**: ricontrollare gli hook `PreToolUse`/`PostToolUse` con `claude mcp serve` sulla
   versione attuale di Claude Code (ultimo test sulla 2.1.299).
4. Idee opzionali: "errore" nel viewer solo per i fallimenti veri (oggi un Bash con stderr non vuoto
   conta come errore); stato aperto/chiuso delle chiamate conservato al cambio chat.
