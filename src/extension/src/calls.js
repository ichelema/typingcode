// Funzioni pure (bun test): chiamate ai tool di una chat di TypingMind, id della chat dall'URL, larghezza del pannello.
import { MIN_W, MAX_W, DEF_W } from './config.js';

const parseArgs = (s) => { if (s && typeof s === 'object') return s; try { return JSON.parse(s); } catch (e) { return null; } };
const OMITTED = '(omesso dal proxy)';             // valore che mcp_proxy.py mette al posto di originalFile/content
// ponytail: la chat non salva isError di MCP, gli errori si riconoscono dal testo; aggiungere i formati nuovi quando compaiono
const ERR_RE = /^(Exit code [1-9]|Tool \w+ input is invalid|<tool_use_error>|### Error)/;

const textOf = (content) => typeof content === 'string' ? content
  : (Array.isArray(content) ? content : []).map((c) => c && c.type === 'text' ? c.text : `[${c && c.type}]`).join('\n');

// Una voce per tool_call_id, in ordine: input da tool_calls[] del messaggio dell'assistente, output e durata dal
// messaggio role "tool" con lo stesso id. Una chiamata senza risposta (tool in corso) ha done = false.
export function callsFromChat(chat) {
  const calls = new Map();
  for (const m of (chat && Array.isArray(chat.messages) ? chat.messages : [])) {
    if (!m) continue;
    for (const tc of Array.isArray(m.tool_calls) ? m.tool_calls : []) {
      const f = (tc && tc.function) || {};
      if (tc && tc.id && !calls.has(tc.id)) calls.set(tc.id, { id: tc.id, tool: f.name || '?', args: parseArgs(f.arguments) });
    }
    if (m.role === 'tool' && m.tool_call_id) {
      const c = calls.get(m.tool_call_id) || { id: m.tool_call_id, tool: m.name || '?', args: null };
      c.res = m;
      calls.set(c.id, c);
    }
  }
  return [...calls.values()].map(toCall);
}

function toCall({ id, tool, args, res }) {
  const a = args || (res && res.pluginResponse && res.pluginResponse.inputParams) || {};
  const c = { id, tool, input: typeof a.command === 'string' ? a.command : JSON.stringify(a), done: !!res, ok: true, out: '', err: '', ms: null, ts: '' };
  if (!res) return c;
  const ex = res.toolExecution || {};
  if (Number.isFinite(ex.startedAt) && Number.isFinite(ex.finishedAt)) c.ms = ex.finishedAt - ex.startedAt;
  c.ts = res.createdAt || '';
  const text = textOf(res.content);
  let j = null;
  try { j = JSON.parse(text); } catch (e) {}
  if (!j || typeof j !== 'object') j = null;
  c.ok = res.format !== 'error' && !ERR_RE.test(text);
  if (j && 'stdout' in j) {                       // Bash: stdout e stderr separati
    c.out = j.stdout || ''; c.err = j.stderr || '';
    if (c.err || j.interrupted) c.ok = false;
  } else c.out = text;
  if (c.ok && j && j.filePath && Array.isArray(j.structuredPatch)) {   // Edit/Write: diff come flatten() di log_viewer.py
    let lines = j.structuredPatch.flatMap((h) => [`@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@`, ...h.lines]);
    if (!lines.length && j.type === 'create') {
      const body = typeof j.content === 'string' && j.content !== OMITTED ? j.content : a.content;
      lines = typeof body === 'string' && body ? body.replace(/\r?\n$/, '').split(/\r?\n/).map((l) => '+' + l) : [];
    }
    Object.assign(c, { file: j.filePath, out: '', diff: lines,
      add: lines.filter((l) => l[0] === '+').length, del: lines.filter((l) => l[0] === '-').length });
  }
  return c;
}

export const chatIdFromHash = (h) => { const x = /(?:^|[#&?])chat=([^&]+)/.exec(h || ''); return x ? decodeURIComponent(x[1]) : null; };
export const clampW = (w) => Math.min(MAX_W, Math.max(MIN_W, Number.isFinite(w) ? w : DEF_W));
