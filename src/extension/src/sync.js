// Sincronizzazione con il viewer: lettura della chat, nuove chiamate, controllo che il viewer risponda.
import { VIEWER_URL, POLL_MS } from './config.js';
import { S } from './state.js';
import { chatIdFromHash, keysFromChat } from './sig.js';
import { readChat } from './db.js';
import { log, noteRead } from './util.js';
import { setSub, postFilter, viewerSrc } from './view.js';

// Legge la chat aperta (UNA lettura completa: puo' costare molto se la chat e' lunga) e manda le chiavi al viewer.
export async function sync(force) {
  if (!S.online || !S.isOpen || !S.frame || !S.frame.contentWindow) return;
  if (S.reading) { S.rerun = true; return; }                          // niente letture sovrapposte
  S.reading = true;
  try {
    const id = chatIdFromHash(location.hash);
    let keys = null, chat = null;                                     // null = nessuna chat aperta: il viewer mostra tutto
    if (id) { const t0 = performance.now(); chat = await readChat(id); keys = keysFromChat(chat); noteRead(performance.now() - t0); }
    setSub(id, chat);
    S.chatKeys = new Set(keys || []);
    S.lastSync = { id, keys, at: Date.now() };
    const fp = id + '|' + (keys ? keys.length + '|' + keys.join('').length : '-');
    if (force || S.needPost || fp !== S.lastFp) {
      S.lastFp = fp; S.needPost = false;
      postFilter(id, keys);
    }
  } catch (e) { log('sync:', e); }
  finally { S.reading = false; if (S.rerun) { S.rerun = false; sync(true); } }
}

// Il viewer segnala chiamate nuove: se la chat non le contiene ancora (il salvataggio puo' arrivare dopo), riprova al massimo 3 volte.
export function onNewEntries(keys) {
  if (!chatIdFromHash(location.hash)) return;                         // nessuna chat aperta: non serve filtrare
  for (const k of keys) if (!S.chatKeys.has(k)) S.pending.add(k);
  if (!S.pending.size || S.chain) return;
  S.chain = true;
  (async () => {
    try {
      for (const wait of [1500, 3000, 6000]) {
        await new Promise((r) => setTimeout(r, wait));
        await sync(true);
        for (const k of [...S.pending]) if (S.chatKeys.has(k)) S.pending.delete(k);
        if (!S.pending.size) break;
      }
    } catch (e) { log('onNewEntries:', e); }
    finally { S.pending.clear(); S.chain = false; }                   // quelle rimaste sono di altre chat: nessun altro tentativo
  })();
}

// Controlla solo se il viewer risponde (nessuna lettura della chat qui).
export async function check() {
  if (!S.frame) return;
  let up = false;
  try { await fetch(VIEWER_URL, { mode: 'no-cors', cache: 'no-store' }); up = true; } catch (e) {}
  const { frame, statusEl, titleEl } = S;
  if (!S.isOpen || !frame) return;
  if (up && !S.online) {                                              // appena raggiungibile: (ri)carica
    frame.src = viewerSrc();
    frame.style.display = 'block';
    statusEl.style.display = 'none';
    titleEl.textContent = 'Tool output';
  } else if (!up && (S.online || frame.style.display !== 'none')) {   // appena sparito
    frame.src = 'about:blank';
    frame.style.display = 'none';
    statusEl.style.display = 'block';
  }
  if (!up) {
    statusEl.textContent = 'Viewer non raggiungibile su 127.0.0.1:8765. Parte insieme al connettore MCP (proxy): nuovo tentativo ogni pochi secondi.';
    titleEl.textContent = 'Tool output (offline)';
  }
  S.online = up;
}
export const stopPolling = () => { if (S.timer) { clearInterval(S.timer); S.timer = null; } };
export const startPolling = () => { stopPolling(); check(); S.timer = setInterval(check, POLL_MS); };
