---
name: scoperte
description: hook non scattano con claude mcp serve (2.1.299); nessun id chat né lato MCP né dall'estensione (generated true); dati completi dei tool nella chat IndexedDB; compattazione del contesto di TypingMind
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
- **Compattazione del contesto di TypingMind**: `_checkAndSummarizeContextIfNeeded`, soglia 70% del
  `contextLength`, taglio al 70% dei messaggi a fine risposta, riassunto salvato come messaggio
  `tm_context_summary`. Sorgente in `references/typingmind`, chunk `0e98c2_2rirwz.js` e
  `2zyxujdnfhj01.js`.
- **Plugin TypingMind `show_tool_output`** (render_html): funziona ma richiede che l'assistente ricopi
  l'output → superato dal proxy.
- Il browser accetta l'iframe e lo script da `http://127.0.0.1:8765` dentro TypingMind (https).
