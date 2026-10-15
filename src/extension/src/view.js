// Elementi di TypingMind, tema, intestazione del pannello e lista delle chiamate ai tool.
import { BTN_ID } from './config.js';
import { S } from './state.js';

const header = () => document.querySelector('[data-element-id="chat-space-beginning-part"]');
// pulsante nativo "About this chat" (apre il pannello di TypingMind): e' l'unico con aria-pressed oltre al nostro
export const nativeBtn = () => { const h = header(); if (!h) return null;
  return h.querySelector('button[data-tooltip-content="About this chat"]') || h.querySelector(`button[aria-pressed]:not(#${BTN_ID})`); };

function bgOf(el) {                                                    // primo sfondo non trasparente risalendo
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const m = (getComputedStyle(e).backgroundColor.match(/[\d.]+/g) || []).map(Number);
    if (m.length >= 3 && (m.length < 4 || m[3] > 0)) return m;
  }
  return [255, 255, 255];
}
// Tema dedotto dallo sfondo reale della chat (funziona con temi personalizzati e con il CSS di altre estensioni).
function themeInfo() {
  const [r, g, b] = bgOf(document.querySelector('[data-element-id="chat-space-background"]') || document.body);
  return { dark: (0.299 * r + 0.587 * g + 0.114 * b) < 128, bg: `rgb(${r},${g},${b})` };
}

export function applyTheme(force) {
  const p = S.panel;
  if (!p) return;
  const t = themeInfo(), key = t.dark + t.bg;
  if (!force && key === S.lastTheme) return;                          // chiamata spesso (osservatore DOM): lavora solo se il tema cambia
  S.lastTheme = key;
  p.style.setProperty('--tv-bg', t.bg);
  p.style.setProperty('--tv-fg', t.dark ? '#fff' : '#0f172a');
  p.style.setProperty('--tv-border', t.dark ? 'rgba(255,255,255,.12)' : 'rgba(15,23,42,.12)');
  p.style.setProperty('--tv-hover', t.dark ? 'rgba(255,255,255,.1)' : 'rgba(15,23,42,.08)');
  p.style.setProperty('--tv-cmd', t.dark ? 'rgba(0,0,0,.35)' : '#1e1e1e');
  p.style.setProperty('--tv-err', t.dark ? '#f87171' : '#c62828');
}

// Il titolo arriva dal record della chat letto in sync() (data-element-id="current-chat-title" e' in realta' la barra dei pulsanti).
export function setSub(id, chat, n) {
  if (!S.chatEl) return;
  S.chatEl.textContent = id ? ((chat && chat.chatTitle) || 'Chat aperta') : 'Nessuna chat aperta';
  S.countEl.textContent = id ? ` · ${n} ${n === 1 ? 'chiamata' : 'chiamate'}` : '';
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const when = (ts) => { const d = new Date(ts); return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString() : d.toLocaleString(); };

// Card chiusa con la sola intestazione; il corpo (input, output, diff) si costruisce alla prima apertura.
function card(c) {
  const box = el('details', 'tv-box'), head = el('summary', 'tv-chead');
  const state = !c.done ? 'run' : c.ok ? 'ok' : 'err';
  head.append(el('strong', null, c.tool), el('span', 'tv-tag ' + state, { run: 'in corso', ok: 'ok', err: 'errore' }[state]),
    el('span', 'tv-prev', (c.file || c.input).split('\n')[0]));
  if (c.diff) { const ds = el('span', 'tv-ds'); ds.append(el('span', 'a', '+' + c.add), el('span', 'd', '-' + c.del)); head.append(ds); }
  if (c.done) head.append(el('span', 'tv-time', `${when(c.ts)} · ${c.ms ?? '?'} ms`));
  box.append(head);
  box.addEventListener('toggle', () => { if (box.open && box.childElementCount === 1) box.append(...body(c)); });
  return box;
}
function body(c) {
  const out = [el('div', 'tv-lbl', c.diff ? 'File' : 'Input'), el('pre', 'tv-cmd', c.file || c.input)];
  if (c.diff) {
    const pre = el('pre', 'tv-diff');
    for (const l of c.diff) pre.append(el('span', { '+': 'a', '-': 'd', '@': 'h' }[l[0]], l + '\n'));
    out.push(el('div', 'tv-lbl', 'Diff'), pre);
  } else if (c.done) out.push(el('div', 'tv-lbl', 'Output'), el('pre', null, c.out || '(vuoto)'));
  if (c.err) out.push(el('div', 'tv-lbl', 'Stderr'), el('pre', 'tv-stderr', c.err));
  return out;
}

// Disegna le chiamate (le piu' recenti in alto). Riusa le card gia' disegnate: ricrea solo quelle nuove o appena finite,
// cosi' restano stato aperto/chiuso e scroll. Lista invariata (stesso numero di chiamate e di chiamate finite) = niente lavoro.
export function render(id, calls, force) {
  const list = S.listEl;
  if (!list) return;
  if (force || id !== S.cardsChat) { S.cards = new Map(); S.cardsChat = id; S.fp = ''; }
  const fp = calls.length + '|' + calls.filter((c) => c.done).length;
  if (fp === S.fp) return;
  S.fp = fp;
  const next = new Map();
  for (const c of calls) {
    const old = S.cards.get(c.id);
    if (old && old.done === c.done) { next.set(c.id, old); continue; }
    const box = card(c);
    if (old && old.el.open) box.open = true;                          // la card aperta resta aperta quando il tool finisce
    next.set(c.id, { done: c.done, el: box });
  }
  S.cards = next;
  const els = [...next.values()].map((v) => v.el).reverse();
  list.replaceChildren(...(els.length ? els : [el('div', 'tv-empty', id ? 'Nessuna chiamata ai tool in questa chat.' : 'Nessuna chat aperta.')]));
}
