// Collegamento al Chrome "reale" aperto con --remote-debugging-port=9222 (profilo separato).
// Uso:
//   node cdp.mjs shot [file.png]        screenshot della scheda TypingMind
//   node cdp.mjs eval "<espressione JS>" valuta nella pagina e stampa il risultato (JSON)
//   node cdp.mjs evalfile <file.js>      come eval, ma legge il codice da file
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { shot } from './shot.mjs';
const require = createRequire(import.meta.url);
const GLOBAL = 'E:/msys64/home/Sphynx/.local/share/mise/installs/node/24.16.0/node_modules';
const { chromium } = require(`${GLOBAL}/@playwright/mcp/node_modules/playwright-core`);

const [cmd, arg] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const pages = browser.contexts().flatMap((c) => c.pages());
const page = pages.find((p) => p.url().includes('typingmind.com')) || pages[0];
if (!page) { console.error('nessuna scheda aperta'); process.exit(1); }

if (cmd === 'shot') {
  // JPEG a metà risoluzione (vedi shot.mjs); 3° argomento opzionale = selettore da ritagliare
  const out = arg || 'C:/Download/test/test/tm-inspect/live.jpg';
  await shot(page, out, { selector: process.argv[4] });
  console.log(page.url(), '->', out);
} else if (cmd === 'eval' || cmd === 'evalfile') {
  const code = cmd === 'eval' ? arg : readFileSync(arg, 'utf8');
  const res = await page.evaluate(code);
  console.log(typeof res === 'string' ? res : JSON.stringify(res, null, 2));
} else {
  console.log('schede:', pages.map((p) => p.url()));
}
// esce senza browser.close(): si stacca dal socket CDP lasciando aperto il browser dell'utente
process.exit(0);
