// bun test: instradamento per chat delle chiamate al connettore MCP (route.js), con un connettore finto.
import { test, expect } from 'bun:test';
import { createRouter, routeId } from '../src/route.js';

const BASE = 'http://127.0.0.1:50880';
const cfg = (chat, extra = {}) => ({ command: 'env.exe', args: ['x'], env: { TM_CHAT_ID: chat, ...extra } });
const start = (f, chat, sid = 'p_claude') => f(`${BASE}/start`, { method: 'POST', headers: {}, body: JSON.stringify({ mcpServers: { [sid]: cfg(chat) } }) });
const call = (f, sid = 'p_claude', what = 'call_tools') => f(`${BASE}/clients/${sid}/${what}`, { method: 'POST', body: '{"name":"Bash","arguments":{}}' });

// Connettore finto: registra le richieste; okStart=false fa fallire gli /start.
function fake({ okStart = true } = {}) {
  const log = [];
  const f = async (url, init = {}) => {
    const u = new URL(url), body = init.body && init.body.startsWith('{') ? JSON.parse(init.body) : null;
    log.push({ path: u.pathname, body });
    const ok = !(u.pathname === '/start' && !okStart);
    return new Response('{}', { status: ok ? 200 : 500 });
  };
  return { f, log };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('start e call_tools vanno al server della chat, con la cartella della chat', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({ chatA: 'D:/a' }));
  await start(r, 'chatA');
  await call(r);
  const rid = routeId('p_claude', 'chatA');
  expect(log[0].path).toBe('/start');
  expect(Object.keys(log[0].body.mcpServers)).toEqual([rid]);
  expect(log[0].body.mcpServers[rid].env).toEqual({ TM_CHAT_ID: 'chatA', TM_ROUTED: '1', MCP_PROXY_CWD: 'D:/a' });
  expect(log[1].path).toBe(`/clients/${rid}/call_tools`);
});

test('due chat concorrenti: lo /start di B aspetta che parta la chiamata di A; ogni chiamata va alla sua chat', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({ A: 'D:/a', B: 'D:/b' }));
  const sa = start(r, 'A');
  const sb = start(r, 'B');                                           // parte mentre A non ha ancora fatto call_tools
  await sa; await tick(); await tick();
  expect(log.filter((e) => e.path === '/start').length).toBe(1);      // B e' in attesa
  const ca = call(r);                                                 // la call di A libera il turno
  await sb;
  const cb = call(r);
  await Promise.all([ca, cb]);
  expect(log.map((e) => e.path)).toEqual(['/start', `/clients/${routeId('p_claude', 'A')}/call_tools`, '/start',
    `/clients/${routeId('p_claude', 'B')}/call_tools`]);
  expect(log[2].body.mcpServers[routeId('p_claude', 'B')].env.MCP_PROXY_CWD).toBe('D:/b');
});

test('anche /tools e\' appaiato allo /start', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({}));
  await start(r, 'A'); await call(r, 'p_claude', 'tools');
  expect(log[1].path).toBe(`/clients/${routeId('p_claude', 'A')}/tools`);
  expect(log[0].body.mcpServers[routeId('p_claude', 'A')].env.MCP_PROXY_CWD).toBe('');
});

test('call_tools senza /start appaiato: errore, il connettore non viene chiamato', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({}));
  await start(r, 'A'); await call(r);
  const res = await call(r);                                          // seconda call senza un nuovo /start
  expect(res.status).toBe(409);
  expect(log.length).toBe(2);
});

test('/start fallito libera il turno', async () => {
  const { f, log } = fake({ okStart: false });
  const r = createRouter(f, () => ({}));
  expect((await start(r, 'A')).ok).toBe(false);
  expect((await start(r, 'B')).ok).toBe(false);                       // non resta bloccato
  expect(log.length).toBe(2);
});

test('nessuna chat ({chatID} non sostituito): server "nochat" senza cartella, elenco tool si, chiamate no', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({ '{chatID}': 'D:/x' }));
  await start(r, '{chatID}');
  expect(Object.keys(log[0].body.mcpServers)).toEqual([routeId('p_claude', 'nochat')]);
  expect(log[0].body.mcpServers[routeId('p_claude', 'nochat')].env.MCP_PROXY_CWD).toBe('');
  await call(r, 'p_claude', 'tools');
  expect(log[1].path).toBe(`/clients/${routeId('p_claude', 'nochat')}/tools`);
  await start(r, '{chatID}');
  expect((await call(r)).status).toBe(409);                          // call_tools senza chat: bloccata
  expect(log.length).toBe(3);
  await start(r, 'A'); await call(r);                                 // il turno e' stato liberato
  expect(log[4].path).toBe(`/clients/${routeId('p_claude', 'A')}/call_tools`);
});

test('server senza TM_CHAT_ID, gia\' instradati, altre richieste e router inattivo: invariati', async () => {
  const { f, log } = fake();
  let active = true;
  const r = createRouter(f, () => ({}), 30000, () => active);
  await r(`${BASE}/start`, { method: 'POST', body: JSON.stringify({ mcpServers: { other: { command: 'x' } } }) });
  await r(`${BASE}/start`, { method: 'POST', body: JSON.stringify({ mcpServers: { p_claude: cfg('A', { TM_ROUTED: '1' }) } }) });
  await call(r, 'other');
  await r(`${BASE}/clients`, {});
  active = false;
  await start(r, 'A');
  expect(log.map((e) => e.path)).toEqual(['/start', '/start', '/clients/other/call_tools', '/clients', '/start']);
  expect(Object.keys(log[1].body.mcpServers)).toEqual(['p_claude']);
  expect(Object.keys(log[4].body.mcpServers)).toEqual(['p_claude']);
});

test('timeout: un /start senza chiamata appaiata non blocca per sempre', async () => {
  const { f, log } = fake();
  const r = createRouter(f, () => ({}), 20);
  await start(r, 'A');                                                // nessuna call
  await start(r, 'B');                                                // aspetta il timeout, poi passa
  await call(r);
  expect(log[2].path).toBe(`/clients/${routeId('p_claude', 'B')}/call_tools`);
});
