---
name: struttura-cartella
description: cosa contiene ogni file e cartella di D:/Sviluppo/Progetti/typingcode (src/mcp, src/extension, dist, script, test/tm-inspect, memory, logs, backups, references) e cosa è escluso da git
metadata:
  type: reference
---

# Struttura della cartella (riorganizzata il 15/10)

| Percorso | Contenuto |
|---|---|
| `CLAUDE.md` | scopo della cartella e import di `memory/MEMORY.md` (fino al 15/10 era `RECAP_sessione.md`) |
| `CLAUDE_OPUS.md` | istruzioni di ruolo per Claude Opus (orchestratore della sessione) |
| `memory/` | base di conoscenza: `MEMORY.md` è l'indice, ogni file è una memoria con frontmatter |
| `src/mcp/mcp_proxy.py` | proxy MCP **v7**: log + avvio viewer + rotazione + regole da `core-behavior.md` + riduzione Edit/Write (v6) + blocco comandi distruttivi (v7). File con fine riga **CRLF** |
| `src/mcp/log_viewer.py` | viewer HTTP porta 8765 (filtro per firma); `/ext.js` serve `dist/ext.js` |
| `src/mcp/core-behavior.md` | regole di comportamento iniettate dal proxy |
| `src/extension/` | estensione: sorgenti in `src/` (10 moduli), test `test/sig.test.js`, `README.md` (fino al 15/10 `ext-repo/`, con un suo `.git` ora eliminato) |
| `dist/` | bundle minificato `ext.js` + `.map` (generato, committato: è il file servito da githack) |
| `script/build.mjs` | build: `src/extension/src/` → `dist/` |
| `script/hooks/` | hook git (`git config core.hooksPath script/hooks`): `pre-commit` (test + build se cambia `src/extension/`, blocca se `dist/` non è aggiornato), `pre-push` (stampa l'URL githack se cambia `dist/ext.js`) |
| `script/chrome-debug.sh` | avvia il Chrome di debug (porta 9222) con il profilo di `test/tm-inspect/` |
| `test/tm-inspect/` | `cdp.mjs` (eval/shot sul Chrome 9222), `shot.mjs` (screenshot leggeri), `chrome-profile/` (~234 MB, login TypingMind: NON cancellare), `playwright-out/` |
| `references/` | copie di riferimento come submodule git (`README.md` con origine e licenza) |
| `logs/` | `proxy_log.jsonl` (letto dal viewer) e `proxy_log_meta.jsonl` (diagnosi a mano), in chiaro, ruotati dal proxy |
| `backups/` | backup creati prima delle modifiche, fuori da git |
| `.git` | repo git dell'intero progetto, email `noreply` impostata nel repo |

**Fuori da git** (`.gitignore`): `test/tm-inspect/chrome-profile/`, `test/tm-inspect/playwright-out/`,
`test/tm-inspect/live.jpg`, `logs/`, `backups/`, `*.tmp`.

**Rollback**: prima di cambiare proxy o viewer, crea un backup in `backups/`; per ripristinare, copia il
file da `backups/` sopra l'originale e riavvia connettore o viewer. L'estensione e il resto del progetto
si ripristinano con git.
