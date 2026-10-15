// Funzioni pure: stessa formula di sig() nel viewer Python (abbinamento chiamata <-> chat).
import { MIN_W, MAX_W, DEF_W } from './config.js';

export const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : JSON.stringify(v);

export const sigOf = (args) => (args && typeof args === 'object' && !Array.isArray(args) && 'command' in args)
  ? JSON.stringify([args.command, args.description || '']) : canon(args);

const parseArgs = (s) => { if (s && typeof s === 'object') return s; try { return JSON.parse(s); } catch (e) { return null; } };

export function keysFromChat(chat) {
  const keys = new Set();
  for (const m of (chat && Array.isArray(chat.messages) ? chat.messages : [])) {
    if (m && Array.isArray(m.tool_calls)) {
      for (const tc of m.tool_calls) {
        const a = parseArgs(tc && tc.function && tc.function.arguments);
        if (a) keys.add(sigOf(a));
      }
    }
    const p = m && m.pluginResponse && m.pluginResponse.inputParams;
    if (p && typeof p === 'object') keys.add(sigOf(p));
  }
  return [...keys];
}

export const chatIdFromHash = (h) => { const x = /(?:^|[#&?])chat=([^&]+)/.exec(h || ''); return x ? decodeURIComponent(x[1]) : null; };
export const clampW = (w) => Math.min(MAX_W, Math.max(MIN_W, Number.isFinite(w) ? w : DEF_W));
