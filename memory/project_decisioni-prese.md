---
name: decisioni-prese
description: resto su MCP (no Agent SDK); 0.5.0 annullata e ritorno alla 0.4.1; prossimo piano pannello dalla chat; repo pubblico typingcode con email noreply; references come submodule; ICH-179 come ricontrollo
metadata:
  type: project
---

# Decisioni prese

- **Resto su MCP** (15/10): valutati il Claude Agent SDK come provider LiteLLM e il prototipo
  `X-TM-Chat-Id` verso l'endpoint del modello. L'utente ha scelto di restare su MCP.
- **0.5.0 annullata, ritorno alla 0.4.1** (15/10 04:40): un processo `claude mcp serve` per chat
  mandava le chiamate delle chat in background al processo della chat aperta (ICH-178), e più proxy
  sullo stesso log corrompevano righe. Lo stato condiviso tra le chat non era un problema reale per
  l'utente: **prima di implementare, chiedere se il limite dà fastidio davvero.**
- **Prossimo piano: pannello che legge dalla chat** (ICH-180). La parte di log e viewer del proxy
  resta finché il prototipo non funziona.
- **Repo**: tutto il progetto in `ichelema/typingcode`, **pubblico** (githack serve solo repo
  pubblici). Email `noreply` impostata nel repo (la globale è personale). `.gitignore` esclude
  profilo Chrome, log, backup e `live.jpg`.
- **`references/` come submodule** (15/10): `typingmind/` ha una licenza che vieta la
  ridistribuzione, `typingmind-extensions/` e `simple-cors-proxy/` non hanno licenza. Nel repo
  stanno solo URL e commit.
- **ICH-179 resta aperta** come ricontrollo degli hook su una versione nuova di Claude Code.
- **Sviluppo solo da Claude Code in `C:/Download/test`; TypingMind è produzione** (15/10): le regole
  iniettate dal proxy (`src/mcp/core-behavior.md` e la sintesi in `mcp_proxy.py`) non parlano delle
  memorie di questo progetto. `CLAUDE.md` e `memory/` servono solo alle sessioni di sviluppo qui.
- **Struttura delle cartelle** decisa dall'utente il 15/10: `src/mcp/`, `src/extension/`, `dist/`,
  `script/`, `test/tm-inspect/`, `logs/`, `memory/`.
- **Lingua**: documenti, memorie, issue e commenti Linear in italiano (il progetto Linear non ha
  `lang:en`); messaggi di commit in inglese.
