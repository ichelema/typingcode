export const NS = 'toolviewer';
export const VERSION = '0.7.1';
export const DB_NAME = 'keyval-store', STORE = 'keyval', CHAT_PREFIX = 'CHAT_';
export const SAVE_DEBOUNCE_MS = 500;    // dopo un salvataggio della chat aperta: una sola lettura per raffica di salvataggi
export const BTN_ID = 'tv-header-btn', PANEL_ID = 'tv-side-panel', STYLE_ID = 'tv-style';
export const K_OPEN = `${NS}_side_open`, K_WIDTH = `${NS}_side_width`;
export const DIR_BTN_ID = 'tv-dir-btn', K_DIRS = `${NS}_workdirs`;   // cartella di lavoro per chat: { chatId: percorso }
// Ultimo uso dei processi per chat { idInstradato: { t, chat } }. Il proxy termina dopo 30 min di inattivita'
// (MCP_PROXY_IDLE_MIN): prima di riusare un processo fermo da IDLE_MS l'estensione elimina la voce dal connettore.
export const K_USE = `${NS}_mcp_use`, IDLE_MS = 29 * 60 * 1000;
export const MIN_W = 320, MAX_W = 900, DEF_W = 450;
