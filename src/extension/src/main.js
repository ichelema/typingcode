// Estensione TypingMind: pulsante nella barra della chat che apre un pannello laterale con le chiamate ai tool
// della chat aperta (input, output, durata), lette dalla chat in IndexedDB.
// Sorgenti in src/, bundle minificato in dist/ext.js (bun script/build.mjs).
// v0.6.0: niente viewer :8765 e niente log del proxy: il pannello disegna le chiamate dalla chat (tutti i server MCP) e
//         la rilegge quando TypingMind la salva (put su IndexedDB). Tolta la modalita' "Tutte".
// v0.4.1: codice diviso in moduli, nessun cambio di comportamento.
// v0.4.0: pannello laterale agganciato alla chat (accanto a "About this chat") al posto del riquadro flottante;
//         ridimensionabile, si chiude se si apre il pannello nativo di TypingMind (e viceversa).
// v0.3.0: la chat non viene piu' riletta ogni 3 secondi (con chat lunghe bloccava la pagina): si legge al cambio di chat,
//         quando la scheda torna visibile, al caricamento del viewer e quando il viewer segnala chiamate non ancora nella chat.
import { NS, VERSION, BTN_ID, PANEL_ID, STYLE_ID, K_OPEN } from './config.js';
import { S } from './state.js';
import { chatIdFromHash } from './calls.js';
import { watchSaves } from './db.js';
import { log, stats, lsGet } from './util.js';
import { CSS } from './style.js';
import { nativeBtn, applyTheme } from './view.js';
import { sync, schedule, cancelSchedule } from './sync.js';
import { ensureButton, ensurePanel, setOpen } from './ui.js';

function init() {
  // Statistiche di lettura, consultabili dalla console: window.__toolviewer_stats
  window[`__${NS}_stats`] = stats;

  // TypingMind cambia chat con history.replaceState, che NON genera hashchange: si intercettano pushState/replaceState
  // (come fa scroll.js di augustx28/typingmind-extensions). Si rilegge la chat solo se l'id e' cambiato davvero.
  let curChat = chatIdFromHash(location.hash), active = true;
  const onNav = () => {
    if (!active) return;
    const id = chatIdFromHash(location.hash);
    if (id === curChat) return;
    curChat = id;
    sync(false);
  };
  for (const fn of ['pushState', 'replaceState']) {                   // wrapper a catena: resta innocuo anche dopo il cleanup
    const orig = history[fn];
    history[fn] = function (...args) { const r = orig.apply(this, args); if (active) queueMicrotask(onNav); return r; };
  }
  const onVisible = () => { if (document.visibilityState === 'visible') sync(false); };
  // Chiamate nuove: TypingMind salva la chat prima di eseguire un tool e di nuovo quando il tool finisce.
  // I salvataggi delle chat in background (altro id) non toccano il pannello. Anche questo wrapper resta innocuo dopo il cleanup.
  watchSaves((id) => { if (active && S.isOpen && id === chatIdFromHash(location.hash)) schedule(); });
  const onDocClick = (ev) => {                                        // se l'utente apre il pannello nativo, chiude il nostro
    const nb = nativeBtn();
    if (!S.isOpen || !nb || !ev.target || !nb.contains(ev.target)) return;
    setTimeout(() => { if (S.isOpen && nb.getAttribute('aria-pressed') === 'true') setOpen(false); }, 50);
  };
  let raf = 0;
  const mo = new MutationObserver(() => {                             // React ridisegna la barra o la colonna: rimette pulsante e pannello
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; ensureButton(); if (S.isOpen) ensurePanel(); });
  });
  // Cambio tema di TypingMind (classe/stile su <html>) con il pannello aperto: applyTheme() lavora solo se il colore cambia davvero.
  // Il <body> ha una transizione di 0,15 s sul colore di sfondo: si rilegge subito e di nuovo a transizione finita.
  let themeT = 0;
  const themeMo = new MutationObserver(() => {
    if (!S.isOpen) return;
    requestAnimationFrame(() => applyTheme());
    clearTimeout(themeT); themeT = setTimeout(() => applyTheme(), 400);
  });

  function start() {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style'); s.id = STYLE_ID; s.textContent = CSS; document.head.append(s);
    }
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('click', onDocClick, true);
    mo.observe(document.body, { childList: true, subtree: true });
    themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    ensureButton();
    if (lsGet(K_OPEN, '0') === '1') setOpen(true);
    log('caricata v' + VERSION);
  }

  // Rimuove tutto (utile per ricaricare l'estensione a mano dalla console durante lo sviluppo).
  window[`__${NS}_cleanup`] = () => {
    active = false; mo.disconnect(); themeMo.disconnect(); cancelSchedule();
    window.removeEventListener('hashchange', onNav);
    window.removeEventListener('popstate', onNav);
    document.removeEventListener('visibilitychange', onVisible);
    document.removeEventListener('click', onDocClick, true);
    for (const id of [BTN_ID, PANEL_ID, STYLE_ID]) { const el = document.getElementById(id); if (el) el.remove(); }
    window[`__${NS}_loaded`] = false;
  };

  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
}

if (!window[`__${NS}_loaded`]) {                                      // guardia contro il doppio caricamento
  window[`__${NS}_loaded`] = true;
  init();
}
