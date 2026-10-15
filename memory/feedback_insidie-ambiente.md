---
name: insidie-ambiente
description: Blast Radius e rm, gh non autenticato, lock di Windows su mv, mcp_proxy.py in CRLF, email git globale personale, cdp.mjs e la prima scheda, browser di test diverso, risparmio token
metadata:
  type: feedback
---

# Insidie dell'ambiente

- **Shell dell'assistente: MSYS2/zsh.** `taskkill //PID n //F` (doppia barra). Python, Bun e Chrome
  vogliono percorsi `C:/...`, non `/c/...`: convertire con `cygpath -m`. `D:\msys64` ed `E:\msys64`
  sono la stessa cartella.
- **Blast Radius** mette in coda i comandi con `rm -rf` (l'utente approva o scarta); alcuni `rm` sono
  rifiutati. Non ripetere il comando: dare all'utente il comando da eseguire.
- **`gh` non è autenticato** nella shell dell'assistente; `git push` via HTTPS funziona. Creare o
  eliminare repository GitHub lo fa l'utente.
- **Email git globale = personale.** Nel repo `typingcode` è impostata l'email `noreply` locale
  (`<id>+ichelema@users.noreply.github.com`, in `.git/config`): dopo un clone nuovo reimpostarla
  prima del primo commit, altrimenti l'email personale finisce nel repo pubblico.
- **Windows blocca `mv` di una cartella** aperta da un programma nativo ("Permission denied"):
  copiare, controllare con `diff -rq`, poi eliminare l'originale.
- **`src/mcp/mcp_proxy.py` ha fine riga CRLF** (gli altri file LF): modifiche su più righe solo via
  script che normalizza a LF e riscrive in CRLF. Per contare i CR usare Python
  (`s.count(b'\r\n')`), non `od | grep '\r'` (inaffidabile).
- **`cdp.mjs` si collega alla prima scheda**: se Chrome apre una sua pagina (es.
  `chrome://search-engine-choice/`), chiuderla prima, o cercare la scheda TypingMind in `/json/list`.
- **Browser di test ≠ browser dell'utente**: il Chrome di debug ha profilo e impostazioni propri (per
  esempio nessun server MCP configurato). Una verifica lì non conferma il browser dell'utente: dirlo.
- **Riavvio di servizi**: dopo una modifica a proxy o viewer, distinguere "codice aggiornato" da
  "processo in esecuzione aggiornato" (pid, `started`). Il proxy riparte alla prossima chiamata a un
  tool o al riavvio del connettore.
- I log contengono tutto in chiaro (anche eventuali segreti letti dai file).
- **Risparmio token**: ogni output grande si ripaga a ogni turno. Evitare Read di file interi (usare
  offset/limit o Grep), output Bash lunghi (sempre `head`/`cut`, mai righe di comando complete dei
  processi), screenshot (solo JPEG ridotti con `shot.mjs`, preferire `eval` con JSON).
- **Orari** nei log e nel diario: da `date +%H:%M`, mai stimati.
