import { NS } from './config.js';

export const log = (...a) => console.log(`[${NS}]`, ...a);

// Statistiche di lettura: main.js le espone in window.__toolviewer_stats
export const stats = { reads: 0, lastMs: 0, maxMs: 0, lastAt: '' };
export const noteRead = (ms) => {
  stats.reads++; stats.lastMs = Math.round(ms); stats.maxMs = Math.max(stats.maxMs, stats.lastMs);
  stats.lastAt = new Date().toLocaleTimeString();
};

export const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
