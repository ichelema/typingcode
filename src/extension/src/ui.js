// Pulsante nella barra della chat e pannello laterale.
import { BTN_ID, PANEL_ID, K_OPEN, K_WIDTH, DEF_W } from './config.js';
import { S } from './state.js';
import { clampW } from './calls.js';
import { lsGet, lsSet } from './util.js';
import { LIST_CSS, ICON_TOOLS, ICON_RELOAD, ICON_CLOSE } from './style.js';
import { nativeBtn, applyTheme } from './view.js';
import { sync } from './sync.js';

function buildPanel() {
  const p = document.createElement('div');
  p.id = PANEL_ID;
  p.style.setProperty('--tv-w', clampW(parseInt(lsGet(K_WIDTH, DEF_W), 10)) + 'px');
  p.innerHTML = `<div class="tv-resize" title="Trascina per ridimensionare"></div>
<div class="tv-head"><div class="tv-titles"><div class="tv-title">Tool output</div><div class="tv-sub"><span class="tv-chat"></span><span class="tv-count"></span></div></div>
<button type="button" class="tv-icon" data-act="reload" aria-label="Ricarica" data-tooltip-id="global" data-tooltip-content="Rileggi la chat">${ICON_RELOAD}</button>
<button type="button" class="tv-icon" data-act="close" aria-label="Chiudi" data-tooltip-id="global" data-tooltip-content="Chiudi">${ICON_CLOSE}</button></div>
<div class="tv-list"></div>`;
  // Lista in uno shadow root: gli osservatori DOM delle altre estensioni non vedono le card (163 card nel documento =
  // long task da 118-143 ms, Chrome di debug 15/10/2026) e il CSS di TypingMind non le tocca.
  // data-sentry-block: Sentry Session Replay di TypingMind (rrweb) non registra gli output dei tool e non serializza le card;
  // va ripetuto dentro lo shadow root perche' rrweb cerca il blocco con closest(), che non esce dallo shadow root.
  p.setAttribute('data-sentry-block', '');
  const root = p.querySelector('.tv-list').attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${LIST_CSS}</style><div data-sentry-block></div>`;
  S.listEl = root.lastChild; S.chatEl = p.querySelector('.tv-chat'); S.countEl = p.querySelector('.tv-count');
  p.querySelector('[data-act="close"]').onclick = () => setOpen(false);
  p.querySelector('[data-act="reload"]').onclick = () => sync(true);
  const grip = p.querySelector('.tv-resize');                         // ridimensionamento trascinando il bordo sinistro
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    p.classList.add('tv-dragging');
    const x0 = e.clientX, w0 = p.getBoundingClientRect().width;
    const move = (ev) => p.style.setProperty('--tv-w', clampW(w0 + (x0 - ev.clientX)) + 'px');
    const up = () => {
      grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      p.classList.remove('tv-dragging');
      lsSet(K_WIDTH, String(Math.round(p.getBoundingClientRect().width)));
    };
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  return p;
}

// Il pannello vive come ultima colonna di chat-space-background, accanto al pannello nativo.
export function ensurePanel() {
  const p = S.panel;
  if (p && p.isConnected && p.parentElement && p.parentElement.dataset.elementId === 'chat-space-background') return;
  const host = document.querySelector('[data-element-id="chat-space-background"]');
  if (!host) return;
  if (!S.panel) S.panel = buildPanel();
  host.append(S.panel);                                               // se React ha ricreato la colonna, il pannello torna con le sue card
  applyTheme();
}

export function ensureButton() {
  if (document.getElementById(BTN_ID)) return;
  const ref = document.querySelector('[data-element-id="select-mode-button"]') || document.querySelector('[data-element-id="minimap-button"]');
  if (!ref || !ref.parentElement) return;
  const tpl = document.querySelector('[data-element-id="minimap-button"]') || ref;
  const b = document.createElement('button');
  b.id = BTN_ID;
  b.type = 'button';
  b.className = tpl.className + ' aria-pressed:bg-slate-900/10 dark:aria-pressed:bg-white/10';
  b.setAttribute('data-tooltip-id', 'global');
  b.setAttribute('data-tooltip-content', 'Tool output');
  b.setAttribute('aria-label', 'Tool output');
  b.setAttribute('aria-pressed', String(S.isOpen));
  b.innerHTML = ICON_TOOLS;
  b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!S.isOpen); });
  ref.insertAdjacentElement('afterend', b);
}

export function setOpen(open) {
  S.isOpen = open;
  lsSet(K_OPEN, open ? '1' : '0');
  const b = document.getElementById(BTN_ID);
  if (b) b.setAttribute('aria-pressed', String(open));
  if (open) {
    const nb = nativeBtn();                                           // un solo pannello a destra: chiude quello nativo
    if (nb && nb.getAttribute('aria-pressed') === 'true') nb.click();
    ensurePanel();
    sync(false);                                                      // a pannello chiuso i salvataggi non vengono letti
  } else if (S.panel) S.panel.remove();
}
