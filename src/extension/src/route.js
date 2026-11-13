// Cartella di lavoro per chat: instradamento delle chiamate al connettore MCP (@typingmind/mcp) verso un processo per chat.
// TypingMind chiama il connettore con POST /start {mcpServers:{<id statico>: config}} e subito dopo
// /clients/<id statico>/call_tools (o /tools), senza id della chat. Il plugin MCP custom mette nella config
// env.TM_CHAT_ID = "{chatID}", che TypingMind sostituisce con la chat che genera (anche in background).
// Qui la coppia /start -> call_tools|tools di uno stesso id statico e' serializzata: finche' la chiamata che segue
// uno /start non e' partita, lo /start successivo aspetta. Entrambe vanno all'id "<statico>__<chat>", con la cartella
// della chat in env.MCP_PROXY_CWD. Una call_tools senza /start appaiato riceve un errore (fail-closed).
import { K_DIRS, K_USE, IDLE_MS } from './config.js';
import { lsGet, lsSet } from './util.js';

const PAIRED = /\/clients\/([^/?#]+)\/(call_tools|tools)$/;
const NO_CHAT = '{chatID}';                                           // variabile non sostituita: nessuna chat (es. impostazioni)

export const getDirs = () => { try { return JSON.parse(lsGet(K_DIRS, '{}')) || {}; } catch (e) { return {}; } };
export function setDir(chat, dir) {
  const d = getDirs();
  if (dir) d[chat] = dir; else delete d[chat];
  lsSet(K_DIRS, JSON.stringify(d));
}
export const routeId = (sid, chat) => `${sid}__${String(chat).replace(/[^\w-]/g, '_')}`;

const lsUse = { get: () => { try { return JSON.parse(lsGet(K_USE, '{}')) || {}; } catch (e) { return {}; } },
  set: (o) => lsSet(K_USE, JSON.stringify(o)) };

// baseFetch: il fetch originale. Ritorna il fetch da mettere al suo posto (isActive() falso = trasparente), con
// .closeChat(chat) per chiudere i processi di una chat eliminata.
// Processi per chat: il proxy si chiude da solo dopo 30 min di inattivita'; il connettore pero' tiene la voce, quindi
// prima di riusare un processo fermo da idleMs la voce viene eliminata (DELETE) e lo /start ne crea uno nuovo.
export function createRouter(baseFetch, dirs = getDirs, timeoutMs = 30000, isActive = () => true,
  { idleMs = IDLE_MS, now = Date.now, store = lsUse } = {}) {
  let conn = null;                                                    // { base, auth } dell'ultimo /start: serve ai DELETE
  const del = (rid, c) => baseFetch(`${c.base}/clients/${encodeURIComponent(rid)}`,
    { method: 'DELETE', headers: c.auth ? { Authorization: c.auth } : {} }).catch(() => {});
  const touch = (rid, chat) => { const u = store.get(); u[rid] = { t: now(), chat }; store.set(u); };
  const st = new Map();                                               // id statico -> { tail, holder }
  const routed = new Set();                                           // id statici visti con TM_CHAT_ID
  const state = (sid) => { let s = st.get(sid); if (!s) st.set(sid, s = { tail: Promise.resolve(), holder: null }); return s; };
  const refuse = (msg) => new Response(JSON.stringify({ error: msg }), { status: 409, headers: { 'Content-Type': 'application/json' } });

  async function routedFetch(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : null;
    if (!isActive() || !url) return baseFetch(input, init);
    let u;
    try { u = new URL(url, globalThis.location && location.href); } catch (e) { return baseFetch(input, init); }
    const method = ((init && init.method) || 'GET').toUpperCase();

    if (method === 'POST' && u.pathname.endsWith('/start') && typeof (init && init.body) === 'string') {
      let body;
      try { body = JSON.parse(init.body); } catch (e) { return baseFetch(input, init); }
      const ids = Object.keys((body && body.mcpServers) || {});
      const cfg = ids.length === 1 ? body.mcpServers[ids[0]] : null;
      const env = cfg && cfg.env;
      if (!env || typeof env.TM_CHAT_ID !== 'string' || env.TM_ROUTED === '1') return baseFetch(input, init);
      const sid = ids[0], chat = env.TM_CHAT_ID && env.TM_CHAT_ID !== NO_CHAT ? env.TM_CHAT_ID : '';
      routed.add(sid);
      const s = state(sid);
      let release;
      const mine = new Promise((r) => { release = r; }), prev = s.tail;
      s.tail = prev.then(() => mine);
      await prev;
      const h = { rid: routeId(sid, chat || 'nochat'), chat };
      h.release = () => { clearTimeout(h.t); if (s.holder === h) s.holder = null; release(); };
      // shortcut: se la chiamata appaiata non arriva entro timeoutMs (start riuscito ma flusso interrotto) il blocco si
      // libera; una chiamata che arrivasse dopo verrebbe appaiata allo /start seguente. Il tempo reale tra i due e' di ms.
      h.t = setTimeout(h.release, timeoutMs);
      s.holder = h;
      const next = { ...cfg, env: { ...env, TM_ROUTED: '1', MCP_PROXY_CWD: (chat && dirs()[chat]) || '' } };
      try {
        let auth = null;
        try { auth = new Headers((init && init.headers) || {}).get('Authorization'); } catch (e) {}
        conn = { base: u.origin, auth };
        const rec = store.get()[h.rid];
        if (rec && now() - rec.t >= idleMs) await del(h.rid, conn);     // processo probabilmente chiuso per inattivita'
        touch(h.rid, chat);
        const r = await baseFetch(u.href, { ...init, body: JSON.stringify({ ...body, mcpServers: { [h.rid]: next } }) });
        if (!r.ok) h.release();
        return r;
      } catch (e) { h.release(); throw e; }
    }

    const m = PAIRED.exec(u.pathname);
    if (m && routed.has(decodeURIComponent(m[1]))) {
      const h = state(decodeURIComponent(m[1])).holder;
      if (!h) return refuse('toolviewer: chiamata MCP senza /start appaiato, non instradata per chat (bloccata)');
      h.release();
      // senza chat ({chatID} non sostituito) solo l'elenco dei tool: una chiamata girerebbe fuori dalla cartella scelta
      if (!h.chat && m[2] === 'call_tools') return refuse('toolviewer: id della chat assente nella config del plugin (TM_CHAT_ID), chiamata bloccata');
      u.pathname = u.pathname.replace(PAIRED, `/clients/${encodeURIComponent(h.rid)}/${m[2]}`);
      touch(h.rid, h.chat);
      try { return await baseFetch(u.href, init); }
      finally { touch(h.rid, h.chat); }                               // una chiamata lunga non conta come inattivita'
    }
    return baseFetch(input, init);
  }

  // Chat eliminata: chiude i suoi processi (se in questa sessione e' gia' passato uno /start, altrimenti ci pensa il
  // timeout del proxy) e dimentica cartella e ultimo uso.
  routedFetch.closeChat = async (chat) => {
    const u = store.get(), rids = Object.keys(u).filter((rid) => u[rid] && u[rid].chat === chat);
    for (const rid of rids) delete u[rid];
    store.set(u);
    setDir(chat, '');
    if (conn) await Promise.all(rids.map((rid) => del(rid, conn)));
    return rids;
  };
  return routedFetch;
}
