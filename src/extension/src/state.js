// Stato condiviso tra i moduli (prima erano variabili locali dell'unico file).
import { K_MODE } from './config.js';
import { lsGet } from './util.js';

export const S = {
  isOpen: false, online: false, lastFp: '', timer: null,
  chatKeys: new Set(), reading: false, rerun: false, chain: false,
  // ultima lettura: riusata quando l'iframe si ricarica (React ricrea la colonna a ogni cambio chat) per non rileggere la chat
  lastSync: { id: undefined, keys: null, at: 0 }, needPost: false,
  pending: new Set(),                       // chiavi segnalate dal viewer e non ancora trovate nella chat
  panel: null, frame: null, statusEl: null, titleEl: null, chatEl: null, countEl: null, segEl: null,
  onlyChat: lsGet(K_MODE, 'chat') !== 'all', // scelta "solo questa chat / tutte", ricordata
  lastTheme: '',
};
