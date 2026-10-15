// Lettura della chat aperta e disegno delle sue chiamate ai tool. Si legge solo su segnale, mai a intervalli:
// apertura del pannello, cambio chat, scheda di nuovo visibile, pulsante Ricarica, salvataggio della chat aperta.
import { SAVE_DEBOUNCE_MS } from './config.js';
import { S } from './state.js';
import { chatIdFromHash, callsFromChat } from './calls.js';
import { readChat } from './db.js';
import { log, noteRead } from './util.js';
import { setSub, render } from './view.js';

// UNA lettura completa della chat + estrazione: 11-18 ms con chat da 1,4 MB (Chrome di debug, 15/10/2026). Le statistiche
// (window.__toolviewer_stats) misurano il tempo totale, compresa l'attesa se la pagina e' occupata.
// ponytail: lettura ed estrazione sul main thread; spostarle in un Worker se una traccia mostra long task dovuti a loro
export async function sync(force) {
  if (!S.isOpen) return;
  if (S.reading) { S.rerun = true; return; }                          // niente letture sovrapposte
  S.reading = true;
  try {
    const id = chatIdFromHash(location.hash);
    let chat = null, calls = [];
    if (id) { const t0 = performance.now(); chat = await readChat(id); calls = callsFromChat(chat); noteRead(performance.now() - t0); }
    setSub(id, chat, calls.length);
    render(id, calls, force);
  } catch (e) { log('sync:', e); }
  finally { S.reading = false; if (S.rerun) { S.rerun = false; sync(false); } }
}

let timer = 0;
export const schedule = () => { clearTimeout(timer); timer = setTimeout(() => sync(false), SAVE_DEBOUNCE_MS); };
export const cancelSchedule = () => clearTimeout(timer);
