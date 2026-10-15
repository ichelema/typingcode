// Stato condiviso tra i moduli.
export const S = {
  isOpen: false, reading: false, rerun: false,
  panel: null, listEl: null, chatEl: null, countEl: null,
  // card disegnate per tool_call_id (riusate a ogni lettura), chat a cui appartengono e impronta dell'ultima lista
  cards: new Map(), cardsChat: undefined, fp: '',
  lastTheme: '',
};
