import { PANEL_ID, DEF_W } from './config.js';

export const CSS = `
#${PANEL_ID}{position:relative;flex:0 0 auto;width:var(--tv-w,${DEF_W}px);height:100%;min-width:0;display:flex;flex-direction:column;
  background:var(--tv-bg);color:var(--tv-fg);border-left:1px solid var(--tv-border);box-shadow:-6px 0 16px rgba(0,0,0,.08);z-index:20}
@media (max-width:1023px){#${PANEL_ID}{position:fixed;top:0;right:0;bottom:0;width:min(100%,var(--tv-w,${DEF_W}px));z-index:70}}
#${PANEL_ID} .tv-resize{position:absolute;top:0;bottom:0;left:0;width:6px;cursor:col-resize;z-index:2;touch-action:none}
#${PANEL_ID} .tv-resize:hover,#${PANEL_ID}.tv-dragging .tv-resize{background:rgba(59,130,246,.5)}
#${PANEL_ID}.tv-dragging iframe{pointer-events:none}
#${PANEL_ID} .tv-head{display:flex;align-items:center;gap:6px;min-height:54px;padding:6px 8px 6px 16px;border-bottom:1px solid var(--tv-border);box-sizing:border-box}
#${PANEL_ID} .tv-titles{flex:1;min-width:0}
#${PANEL_ID} .tv-title{font-weight:600;font-size:15px;line-height:1.3}
#${PANEL_ID} .tv-sub{font-size:12px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#${PANEL_ID} .tv-icon{background:none;border:0;color:inherit;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
#${PANEL_ID} .tv-icon:hover{background:var(--tv-hover)}
#${PANEL_ID} .tv-seg{display:flex;flex:0 0 auto;border:1px solid var(--tv-border);border-radius:8px;overflow:hidden;margin-right:2px}
#${PANEL_ID} .tv-seg[hidden]{display:none}
#${PANEL_ID} .tv-seg button{background:none;border:0;color:inherit;font:inherit;font-size:12px;line-height:1;padding:6px 9px;cursor:pointer;opacity:.65}
#${PANEL_ID} .tv-seg button:hover{opacity:1}
#${PANEL_ID} .tv-seg button[aria-pressed="true"]{background:var(--tv-hover);opacity:1;font-weight:600}
#${PANEL_ID} .tv-status{padding:16px;font-size:13px;line-height:1.5;opacity:.8}
#${PANEL_ID} iframe{flex:1;width:100%;border:0;display:none;background:transparent}`;

const svg = (inner) => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
export const ICON_TOOLS = svg('<rect x="1.75" y="2.75" width="14.5" height="12.5" rx="2"/><polyline points="5 7 7.5 9 5 11"/><line x1="9.5" y1="11.25" x2="13" y2="11.25"/>');
export const ICON_RELOAD = svg('<path d="M15.25 9a6.25 6.25 0 1 1-1.83-4.42"/><polyline points="15.25 2.75 15.25 5.75 12.25 5.75"/>');
export const ICON_CLOSE = svg('<line x1="4.5" y1="4.5" x2="13.5" y2="13.5"/><line x1="13.5" y1="4.5" x2="4.5" y2="13.5"/>');
