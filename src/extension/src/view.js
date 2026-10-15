// Elementi di TypingMind, tema e intestazione del pannello.
import { BTN_ID, VIEWER_URL, VIEWER_ORIGIN, K_MODE } from './config.js';
import { S } from './state.js';
import { lsSet } from './util.js';

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
export const viewerSrc = () => { const t = themeInfo(); return `${VIEWER_URL}?embed=1&dark=${t.dark ? 1 : 0}&bg=${encodeURIComponent(t.bg)}`; };

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
  if (S.online && S.frame && S.frame.contentWindow) S.frame.contentWindow.postMessage({ type: 'tm-theme', dark: t.dark, bg: t.bg }, VIEWER_ORIGIN);
}

// Il titolo arriva dal record della chat letto in sync() (data-element-id="current-chat-title" e' in realta' la barra dei pulsanti).
export function setSub(id, chat) {
  if (!S.chatEl) return;
  S.chatEl.textContent = id ? ((chat && chat.chatTitle) || 'Chat aperta') : 'Nessuna chat aperta';
}
// Conteggio e selettore "Chat / Tutte" nell'intestazione: lo stato arriva dal viewer (tm-viewer-status).
export function onStatus(s) {
  if (!S.countEl) return;
  if (s.error) { S.countEl.textContent = ' · viewer non raggiungibile'; return; }
  S.countEl.textContent = s.filtered ? ` · ${s.shown} di ${s.total} chiamate` : ` · ${s.total} chiamate${s.filterable ? ' (tutte)' : ''}`;
  S.segEl.hidden = !s.filterable;
}
export function setMode(chatOnly) {
  S.onlyChat = chatOnly;
  lsSet(K_MODE, chatOnly ? 'chat' : 'all');
  if (S.segEl) for (const b of S.segEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String((b.dataset.mode === 'chat') === chatOnly));
  if (S.online && S.frame && S.frame.contentWindow) S.frame.contentWindow.postMessage({ type: 'tm-set-mode', onlyChat: S.onlyChat }, VIEWER_ORIGIN);
}
export const postFilter = (id, keys) => S.frame.contentWindow.postMessage({ type: 'tm-chat-filter', chatId: id, keys, onlyChat: S.onlyChat }, VIEWER_ORIGIN);
