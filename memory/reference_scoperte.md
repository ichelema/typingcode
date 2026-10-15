---
name: scoperte
description: hook non scattano con claude mcp serve (2.1.299); nessun id chat (generated true); dati dei tool nella chat IndexedDB; salvataggio con put; errori format error; Sentry Replay; costo accessibilità; connettore 50880/50881 e HOSTNAME; compattazione del contesto
metadata:
  type: reference
---

# Scoperte ed esclusioni

- **Hook Claude Code (PostToolUse)**: funzionano in Claude Code normale, **non scattano con
  `claude mcp serve`** (né da `.claude/settings.json` né da plugin `--plugin-dir`). Versione testata:
  2.1.299. Ricontrollo su una versione nuova: ICH-179.
- **Nessun id di chat lato MCP**: tutte le chat passano da un unico canale (`clientInfo` =
  `mcp-http-bridge-claude_code`), `params` contiene solo `name` e `arguments`.
  `CLAUDE_CODE_SESSION_ID` identifica il processo server, non la chat.
- **Nessun id di chat neppure dall'estensione** (15/10): la richiesta al connettore contiene solo
  `name` e `arguments`. TypingMind conosce `chatID` (`contextVariables`), ma i server del JSON MCP sono
  plugin `generated: true` e `_getPluginFunctionMCPServerConfigWithVariables` non sostituisce le
  variabili. Con un processo per chat, l'id preso da `location.hash` è sbagliato per le chat in
  background (ICH-178).
- **La chat in IndexedDB contiene tutti i dati dei tool** (15/10, chat `ROa5e2T-v_`): input in
  `tool_calls[].function.arguments`, output nel messaggio `role: "tool"` (`content[0].text`, collegato
  da `tool_call_id`), durata in `toolExecution.finishedAt − startedAt`. Base di ICH-180.
  Il messaggio `tool` ha anche `name`, `pluginUUID` (server MCP), `createdAt`, `pluginResponse.inputParams`.
- **Salvataggio della chat** (15/10, sorgente + prova dal vivo): idb-keyval `set` →
  `IDBObjectStore.put(chat, "CHAT_<id>")`, senza debounce, sotto un Web Lock. Il messaggio con
  `tool_calls` è salvato **prima** dell'esecuzione del tool; i messaggi `tool` quando finisce il gruppo.
  Nessun evento pubblico; la riga del tool nel DOM non ha `data-element-id`. L'estensione 0.6.0 osserva
  `put` per sapere quando rileggere la chat aperta.
- **Errori dei tool nella chat**: TypingMind (`_toolErrorMessage`) mette `format: "error"` e `content`
  stringa. L'`isError` di MCP non viene salvato: i fallimenti di Claude Code sono solo testo
  (`Exit code N\n…`, `Tool Edit input is invalid: …`), quelli di Playwright iniziano con `### Error`.
- **Sentry Session Replay (rrweb) in TypingMind** (chunk `08p__rxk_v8kp.js`): registra il DOM, anche
  dentro gli shadow root. `blockSelector` contiene `[data-sentry-block]`, controllato con `closest()`:
  dentro uno shadow root l'attributo va ripetuto. Senza blocco, gli output dei tool disegnati nel DOM
  finirebbero nelle registrazioni.
- **Costo dell'accessibilità di Chrome** (Chrome di debug, client CDP collegati): un disegno di 163
  card = task da 80–100 ms, di cui 72 ms `RunAccessibilitySteps`; gonfia anche i long task di TypingMind
  al cambio chat (184–490 ms). Non misurato nel browser dell'utente.
- **Connettore `@typingmind/mcp`**: porte `[50880, 50881]` (la pagina di setup le prova ogni 3 s), un
  solo token per processo (`argv[2]` o `MCP_AUTH_TOKEN`), `PORT` forza la porta, `HOSTNAME` = indirizzo
  di ascolto (la shell MSYS2 lo esporta con il nome del PC → ascolto solo sull'IP di rete). Un comando
  con il solo nome (`rust-mcp-filesystem.exe`) parte solo se il `PATH` del connettore lo contiene.
- **Compattazione del contesto di TypingMind**: `_checkAndSummarizeContextIfNeeded`, soglia 70% del
  `contextLength`, taglio al 70% dei messaggi a fine risposta, riassunto salvato come messaggio
  `tm_context_summary`. Sorgente in `references/typingmind`, chunk `0e98c2_2rirwz.js` e
  `2zyxujdnfhj01.js`.
- **Plugin TypingMind `show_tool_output`** (render_html): funziona ma richiede che l'assistente ricopi
  l'output → superato dal proxy.
- Il browser accetta l'iframe e lo script da `http://127.0.0.1:8765` dentro TypingMind (https).
- Da controllare: se il riassunto automatico del contesto toglie messaggi dal record della chat, il
  pannello 0.6.0 perde le chiamate vecchie (il log del proxy no).
