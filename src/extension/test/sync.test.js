import { test, expect } from 'bun:test';
import { S } from '../src/state.js';
import { sync, clearCalls } from '../src/sync.js';

// IndexedDB e DOM minimi, senza mock dei moduli condivisi con gli altri test.
test('svuota solo le card visibili della chat, anche con letture e tool in corso', async () => {
  const originalLocation = globalThis.location, originalDocument = globalThis.document, originalDB = globalThis.indexedDB;
  const chats = new Map();
  let pending = null;
  const db = { objectStoreNames: { contains: () => true }, transaction: () => ({ objectStore: () => ({ get: (key) => {
    const request = {}, value = chats.get(key.slice(5));
    const finish = () => { request.result = value; request.onsuccess(); };
    if (pending) pending.finish = finish; else queueMicrotask(finish);
    return request;
  } }) }) };
  globalThis.indexedDB = { open: () => { const request = {}; queueMicrotask(() => { request.result = db; request.onsuccess(); }); return request; } };
  globalThis.location = { hash: '#chat=A' };
  globalThis.document = { createElement: () => ({ append() {}, addEventListener() {} }) };
  const list = { replaceChildren() {} };
  Object.assign(S, { isOpen: true, reading: false, rerun: false, cards: new Map(), cardsChat: undefined, fp: '',
    hiddenCalls: new Map(), listEl: list, chatEl: {}, countEl: {} });
  const chat = (...ids) => ({ chatTitle: 'Titolo', messages: [{ tool_calls: ids.map((id) => ({ id, function: { name: 'Read' } })) }] });
  const ids = () => [...S.cards.keys()];
  try {
    chats.set('A', chat('old', 'pending'));
    await sync(false);
    expect(ids()).toEqual(['old', 'pending']);
    clearCalls();
    expect(ids()).toEqual([]);
    expect(S.countEl.textContent).toBe(' · 0 chiamate');
    expect(S.chatEl.textContent).toBe('Titolo');
    clearCalls();
    const completed = chat('old', 'pending', 'new');
    completed.messages.push({ role: 'tool', tool_call_id: 'pending', content: 'ok' });
    chats.set('A', completed);
    await sync(true);
    expect(ids()).toEqual(['new']);
    clearCalls();
    chats.set('A', chat('old', 'pending', 'new', 'newer'));
    await sync(false);
    expect(ids()).toEqual(['newer']);

    location.hash = '#chat=B';
    clearCalls(); // Le card ancora disegnate appartengono ad A.
    chats.set('B', chat('old', 'b'));
    await sync(false);
    expect(ids()).toEqual(['old', 'b']);
    clearCalls();
    S.isOpen = false;
    S.isOpen = true;
    location.hash = '#chat=A';
    await sync(true);
    expect(ids()).toEqual(['newer']);

    pending = {};
    const inFlight = sync(true);
    await Promise.resolve();
    clearCalls();
    const finish = pending.finish; pending = null; finish();
    await inFlight;
    expect(ids()).toEqual([]);
    chats.set('A', chat('old', 'pending', 'new', 'newer', 'after'));
    await sync(false);
    expect(ids()).toEqual(['after']);

    pending = {};
    const stale = sync(false);
    await Promise.resolve();
    location.hash = '#chat=B';
    const finishStale = pending.finish; pending = null; finishStale();
    await stale;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(S.cardsChat).toBe('B');
    expect(ids()).toEqual([]);
  } finally {
    globalThis.location = originalLocation; globalThis.document = originalDocument; globalThis.indexedDB = originalDB;
  }
});
