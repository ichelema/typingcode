// Pulsante "cartella di lavoro" nella barra dei pulsanti del prompt (accanto a voce e ragionamento).
// La cartella vale per la chat aperta; le chiamate a Claude Code di quella chat partono li' (route.js + mcp_proxy.py).
import { DIR_BTN_ID } from './config.js';
import { chatIdFromHash } from './calls.js';
import { getDirs, setDir } from './route.js';
import { ICON_FOLDER } from './style.js';

const bar = () => document.querySelector('[data-element-id="chat-input-actions"] > div');
let shown = null;                                                     // ultimo stato disegnato: evita lavoro a ogni mutazione

function tip(chat, dir) {
  if (!chat) return 'Cartella di lavoro: invia il primo messaggio, poi scegli la cartella di questa chat';
  return dir ? `Cartella di lavoro: ${dir}` : 'Cartella di lavoro: predefinita (clic per sceglierla)';
}

function refresh(b) {
  const chat = chatIdFromHash(location.hash), dir = (chat && getDirs()[chat]) || '';
  const key = chat + '|' + dir;
  if (key === shown && b.isConnected) return;
  shown = key;
  b.setAttribute('aria-pressed', String(!!dir));
  b.setAttribute('aria-label', tip(chat, dir));
  b.setAttribute('data-tooltip-content', tip(chat, dir));
}

function ask() {
  const chat = chatIdFromHash(location.hash);
  if (!chat) { alert(tip(null)); return; }
  const cur = getDirs()[chat] || '';
  const v = prompt('Cartella di lavoro di questa chat per Claude Code (percorso assoluto, es. D:/progetti/app).\n'
    + 'Vuoto = cartella predefinita. Il cambio riavvia il processo della chat: non farlo mentre un tool e\' in corso.', cur);
  if (v === null) return;                                             // annullato
  setDir(chat, v.trim());
  shown = null;
  const b = document.getElementById(DIR_BTN_ID);
  if (b) refresh(b);
}

// Chiamata dal MutationObserver e al cambio chat: crea il pulsante se React lo ha tolto, aggiorna stato e tooltip.
export function ensureDirButton() {
  let b = document.getElementById(DIR_BTN_ID);
  if (!b) {
    const host = bar();
    const tpl = document.querySelector('[data-element-id="voice-input-button"]');
    if (!host) return;
    b = document.createElement('button');
    b.id = DIR_BTN_ID;
    b.type = 'button';
    b.className = tpl ? tpl.className : '';                         // stesso aspetto dei pulsanti vicini; colore attivo nel CSS
    b.setAttribute('data-tooltip-id', 'global');
    b.innerHTML = ICON_FOLDER;
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); ask(); });
    host.append(b);
    shown = null;
  }
  refresh(b);
}
