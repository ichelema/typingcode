import { PANEL_ID, DEF_W } from './config.js';

// CSS del pannello (nel documento di TypingMind).
export const CSS = `
#${PANEL_ID}{position:relative;flex:0 0 auto;width:var(--tv-w,${DEF_W}px);height:100%;min-width:0;display:flex;flex-direction:column;
  background:var(--tv-bg);color:var(--tv-fg);border-left:1px solid var(--tv-border);box-shadow:-6px 0 16px rgba(0,0,0,.08);z-index:20}
@media (max-width:1023px){#${PANEL_ID}{position:fixed;top:0;right:0;bottom:0;width:min(100%,var(--tv-w,${DEF_W}px));z-index:70}}
#${PANEL_ID} .tv-resize{position:absolute;top:0;bottom:0;left:0;width:6px;cursor:col-resize;z-index:2;touch-action:none}
#${PANEL_ID} .tv-resize:hover,#${PANEL_ID}.tv-dragging .tv-resize{background:rgba(59,130,246,.5)}
#${PANEL_ID} .tv-head{display:flex;align-items:center;gap:6px;min-height:54px;padding:6px 8px 6px 16px;border-bottom:1px solid var(--tv-border);box-sizing:border-box}
#${PANEL_ID} .tv-titles{flex:1;min-width:0}
#${PANEL_ID} .tv-title{font-weight:600;font-size:15px;line-height:1.3}
#${PANEL_ID} .tv-sub{font-size:12px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#${PANEL_ID} .tv-icon{background:none;border:0;color:inherit;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
#${PANEL_ID} .tv-icon:hover{background:var(--tv-hover)}
#${PANEL_ID} .tv-list{flex:1;min-height:0;overflow:auto;padding:10px 12px}`;

// CSS della lista, dentro lo shadow root di .tv-list: le variabili --tv-* arrivano dal pannello per ereditarieta'.
export const LIST_CSS = `
.tv-empty{opacity:.65;text-align:center;padding:40px 16px;font-size:13px}
.tv-box{border:1px solid var(--tv-border);border-radius:8px;overflow:hidden;margin-bottom:10px;content-visibility:auto;contain-intrinsic-size:auto 36px}
.tv-chead{display:flex;gap:8px;align-items:center;padding:8px 12px;background:var(--tv-hover);font-size:13px;cursor:pointer;list-style:none;user-select:none}
.tv-chead::-webkit-details-marker{display:none}
.tv-chead::before{content:'';flex:none;border:5px solid transparent;border-left:6px solid currentColor;border-right:0;opacity:.5;transition:transform .12s}
details[open]>.tv-chead::before{transform:rotate(90deg)}
.tv-prev{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:Consolas,monospace;font-size:12px;opacity:.65}
details[open]>.tv-chead .tv-prev{visibility:hidden}
.tv-tag{flex:none;border-radius:10px;padding:1px 8px;font-size:11px;color:#fff}
.tv-tag.ok{background:#2e7d32}
.tv-tag.err{background:#c62828}
.tv-tag.run{background:#64748b}
.tv-time{flex:none;opacity:.65;font-size:12px}
.tv-ds{flex:none;font-family:Consolas,monospace;font-size:12px}
.tv-ds .a{color:#2e9e47}
.tv-ds .d{color:var(--tv-err);margin-left:5px}
.tv-lbl{font-size:11px;opacity:.65;padding:8px 12px 2px;text-transform:uppercase}
pre{margin:0;padding:6px 12px 10px;font-family:Consolas,monospace;font-size:12.5px;white-space:pre-wrap;word-break:break-word;max-height:100px;overflow:auto;box-sizing:border-box}
.tv-cmd{background:var(--tv-cmd);color:#d4d4d4}
.tv-stderr{color:var(--tv-err)}
.tv-diff span{display:block}
.tv-diff .a{background:rgba(46,158,71,.16)}
.tv-diff .d{background:rgba(220,60,60,.16)}
.tv-diff .h{opacity:.6}`;

const svg = (inner) => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
export const ICON_TOOLS = svg('<rect x="1.75" y="2.75" width="14.5" height="12.5" rx="2"/><polyline points="5 7 7.5 9 5 11"/><line x1="9.5" y1="11.25" x2="13" y2="11.25"/>');
export const ICON_RELOAD = svg('<path d="M15.25 9a6.25 6.25 0 1 1-1.83-4.42"/><polyline points="15.25 2.75 15.25 5.75 12.25 5.75"/>');
export const ICON_CLOSE = svg('<line x1="4.5" y1="4.5" x2="13.5" y2="13.5"/><line x1="13.5" y1="4.5" x2="4.5" y2="13.5"/>');
