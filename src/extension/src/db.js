// Lettura della chat da IndexedDB di TypingMind (sola lettura) e segnale dei suoi salvataggi.
import { DB_NAME, STORE, CHAT_PREFIX } from './config.js';

let dbp = null;
const openDb = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME);
  r.onsuccess = () => { const db = r.result; db.onversionchange = () => { db.close(); dbp = null; }; res(db); };
  r.onerror = () => { dbp = null; rej(r.error); };
}));

// Segnale "chat salvata": TypingMind salva con idb-keyval set() -> put(chat, 'CHAT_<id>') e non emette eventi pubblici.
// Il wrapper chiama sempre l'originale e guarda solo la chiave: non cambia il valore e non scrive niente.
export function watchSaves(cb) {
  const orig = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args) {
    const r = orig.apply(this, args), key = args[1];                  // put(value, key)
    try {
      if (typeof key === 'string' && key.startsWith(CHAT_PREFIX) && this.name === STORE && this.transaction.db.name === DB_NAME) {
        cb(key.slice(CHAT_PREFIX.length));
      }
    } catch (e) {}                                                    // un errore dell'estensione non deve rompere il salvataggio
    return r;
  };
}

export async function readChat(id) {
  const db = await openDb();
  if (!db.objectStoreNames.contains(STORE)) return null;
  return new Promise((res, rej) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(CHAT_PREFIX + id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}
