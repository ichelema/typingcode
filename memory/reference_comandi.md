---
name: comandi
description: comandi verificati il 2026-10-15 — test e build dell'estensione, hook git, Chrome di debug, cdp.mjs, riavvio del viewer, controllo del proxy, Linear
metadata:
  type: reference
---

# Comandi (dalla radice `D:/Sviluppo/Progetti/typingcode`, verificati il 15/10)

```bash
(cd src/extension && bun test)                 # test delle funzioni pure (4 test)
bun script/build.mjs [--watch]                 # src/extension/src/ -> dist/ext.js (+ .map)
git config core.hooksPath script/hooks         # una volta dopo il clone: attiva pre-commit e pre-push
bash script/chrome-debug.sh                    # Chrome di debug su :9222 (non apre una seconda istanza)
node test/tm-inspect/cdp.mjs eval "<js>"       # esegue JS nella prima scheda del Chrome 9222
node test/tm-inspect/cdp.mjs shot [file.jpg]   # screenshot leggero
```

Riavvio del viewer (dopo una modifica a `log_viewer.py`):

```bash
P=$(netstat -ano | grep LISTEN | grep '127.0.0.1:8765 ' | awk '{print $NF}'); taskkill //PID $P //F
python3 -c "import subprocess; subprocess.Popen([r'D:\msys64\ucrt64\bin\pythonw.exe', r'D:\Sviluppo\Progetti\typingcode\src\mcp\log_viewer.py'], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=0x08000208, close_fds=True)"
```

Controlli:
- proxy attivi: `ps -W | grep python3` (winpid e ora di avvio); quale codice usa: ultima riga di
  `logs/proxy_log.jsonl` o `logs/proxy_log_meta.jsonl`, campi `pid` e `started`;
- viewer: `netstat -ano | grep 8765` (ultimo numero = pid);
- errori del connettore: `E:\AI\Claude\mcp_claude_err.log`;
- URL pubblicato: `curl` → 200, `application/javascript`, CORS `*`, `cmp` con `dist/ext.js`.

Linear (team `ICH`, progetto **Typingcode**, id `6b77c2a7-6f42-4f46-86ca-147f9a170342`):

```bash
"E:/msys64/home/Sphynx/.local/share/mise/installs/python/3.13.13/python.exe" \
  E:/msys64/home/Sphynx/.claude/skills/trinity/skills/linear/scripts/linear.py query '<graphql>'
```

Le query troppo grandi falliscono con "Query too complex": dividerle. Testi lunghi (descrizioni,
commenti) via `--variables @file.json`.
