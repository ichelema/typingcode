// Lettura della chat da IndexedDB di TypingMind (sola lettura).
import { DB_NAME, STORE, CHAT_PREFIX } from './config.js';

let dbp = null;
const openDb = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME);
  r.onsuccess = () => { const db = r.result; db.onversionchange = () => { db.close(); dbp = null; }; res(db); };
  r.onerror = () => { dbp = null; rej(r.error); };
}));

export async function readChat(id) {
  const db = await openDb();
  if (!db.objectStoreNames.contains(STORE)) return null;
  return new Promise((res, rej) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(CHAT_PREFIX + id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}
