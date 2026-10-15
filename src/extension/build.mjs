// Bundle: src/main.js -> <progetto>/dist/ext.js (IIFE minificato + source map). Uso: bun build.mjs [--watch]
import { watch } from 'node:fs';

const root = import.meta.dir;
const out = `${root}/../../dist`;   // dist/ nella radice del progetto: e' il file servito da githack
async function build() {
  const t0 = performance.now();
  const r = await Bun.build({
    entrypoints: [`${root}/src/main.js`],
    outdir: out,
    naming: 'ext.js',
    format: 'iife',
    target: 'browser',
    minify: true,
    sourcemap: 'linked',
  });
  if (!r.success) { for (const m of r.logs) console.error(m); console.log('FAIL build'); return false; }
  const size = (await Bun.file(`${out}/ext.js`).arrayBuffer()).byteLength;
  console.log(`PASS dist/ext.js ${(size / 1024).toFixed(1)} KB in ${Math.round(performance.now() - t0)} ms`);
  return true;
}

const ok = await build();
if (process.argv.includes('--watch')) {
  console.log('watch su src/ (Ctrl+C per uscire)');
  let t = 0;
  watch(`${root}/src`, () => { clearTimeout(t); t = setTimeout(build, 100); });
} else process.exit(ok ? 0 : 1);
