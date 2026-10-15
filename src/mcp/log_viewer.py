"""Viewer locale: mostra in tempo reale le tool call registrate da mcp_proxy.py. Solo 127.0.0.1.
v2: filtro per chat. L'estensione TypingMind manda (postMessage) le chiamate della chat aperta;
il viewer mostra solo le voci del log con la stessa chiave (comando + descrizione).
v3: modalita' incorporata (?embed=1, senza intestazione) e tema chiaro/scuro passato dall'estensione;
conteggio e scelta "chat / tutte" mandati alla pagina che incorpora (tm-viewer-status / tm-set-mode)."""
import json, os, hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

LOG = os.environ.get("VIEWER_LOG", r"C:\Download\test\logs\proxy_log.jsonl")   # override solo per i test
PORT = int(os.environ.get("VIEWER_PORT", "8765"))
EXT = "C:/Download/test/dist/ext.js"   # bundle generato da src/extension/build.mjs

PAGE = """<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Tool output viewer</title>
<script>
// v3: ?embed=1 (dentro il pannello TypingMind: niente intestazione) e tema passato dall'estensione (&dark=1&bg=rgb(...)),
// applicati prima del disegno per evitare il lampo di tema chiaro.
(function(){var p=new URLSearchParams(location.search),c=document.documentElement.classList;
if(p.get('embed')==='1')c.add('embed');if(p.get('dark')==='1')c.add('dark');
var bg=p.get('bg');if(bg&&/^rgb[(][0-9, ]+[)]$/.test(bg))document.documentElement.style.setProperty('--bg',bg);})();
</script><style>
:root{--bg:#f4f4f4;--fg:#222;--card:#fff;--card-head:#f0f0f0;--border:#ddd;--muted:#666;--err:#c62828;--cmd-bg:#1e1e1e;--cmd-fg:#d4d4d4}
html.dark{color-scheme:dark;--bg:#212121;--fg:#e5e7eb;--card:rgba(255,255,255,.04);--card-head:rgba(255,255,255,.07);--border:rgba(255,255,255,.12);--muted:#9ca3af;--err:#f87171;--cmd-bg:rgba(0,0,0,.35)}
body{font-family:Segoe UI,Arial,sans-serif;margin:0;background:var(--bg);color:var(--fg)}
header{position:sticky;top:0;background:#222;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px}
#count{font-size:13px;opacity:.8} main{padding:12px;max-width:1000px;margin:auto}
html.embed header{display:none} html.embed main{padding:10px 12px;max-width:none}
#mode{display:none;background:#444;color:#fff;border:1px solid #777;border-radius:12px;padding:3px 10px;cursor:pointer;font-size:12px}
.box{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--card);margin-bottom:12px}
.head{display:flex;gap:8px;align-items:center;padding:8px 12px;background:var(--card-head);font-size:13px;cursor:pointer;list-style:none;user-select:none}
.head::-webkit-details-marker{display:none}
.head::before{content:'';flex:none;border:5px solid transparent;border-left:6px solid var(--muted);border-right:0;transition:transform .12s}
details[open]>.head::before{transform:rotate(90deg)}
.prev{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:Consolas,monospace;font-size:12px;color:var(--muted)}
details[open]>.head .prev{visibility:hidden}
.tag{border-radius:10px;padding:1px 8px;font-size:11px;color:#fff}.ok{background:#2e7d32}.err{background:#c62828}
.time{flex:none;color:var(--muted);font-size:12px}
.lbl{font-size:11px;color:var(--muted);padding:8px 12px 2px;text-transform:uppercase}
pre{margin:0;padding:6px 12px 10px;font-family:Consolas,monospace;font-size:12.5px;white-space:pre-wrap;word-break:break-word;max-height:100px;overflow:auto;box-sizing:border-box}
.cmd{background:var(--cmd-bg);color:var(--cmd-fg)}.stderr{color:var(--err)}
#empty{color:var(--muted);text-align:center;padding:40px}
#filters{position:sticky;top:0;z-index:2;display:flex;gap:8px;padding:2px 0 10px;background:var(--bg)}
#filters select{flex:1;min-width:0;background:var(--menu-bg);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:4px 6px;font-size:12.5px;cursor:pointer}
#filters option{background:var(--menu-bg);color:var(--fg)}
:root{--menu-bg:#fff} html.dark{--menu-bg:#2b2d31}
html.embed #filters{margin-top:-10px;padding-top:10px}
.ds{flex:none;font-family:Consolas,monospace;font-size:12px}.ds .a{color:#2e9e47}.ds .d{color:var(--err);margin-left:5px}
.diff span{display:block}.diff .a{background:rgba(46,158,71,.16)}.diff .d{background:rgba(220,60,60,.16)}.diff .h{color:var(--muted)}
</style></head><body>
<header><strong>Tool output viewer</strong><span><span id="count">in attesa...</span> <button id="mode"></button></span></header>
<main><div id="filters"><select id="f-tool" title="Filtra per tool"><option value="">Tutti i tool</option></select><select id="f-state" title="Filtra per stato"><option value="">Tutti gli stati</option><option value="ok">ok</option><option value="err">errore</option></select></div><div id="empty">Nessuna chiamata registrata finora.</div><div id="list"></div></main>
<script>
const openState = new Map();
let since = 0, epoch = '', loaded = false, all = [], filterKeys = null, onlyChat = true;
const parentOrigin = (location.ancestorOrigins && location.ancestorOrigins[0]) || 'https://www.typingmind.com';
function el(tag, cls, text){const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e;}
function renderOne(e){
  const box = el('details','box'), head = el('summary','head'), i = e._i;
  box.open = openState.get(i) === true;   // chiuse di default, anche le nuove
  box.addEventListener('toggle', () => openState.set(i, box.open));
  head.append(el('strong',null,e.tool), el('span','tag '+(e.ok?'ok':'err'), e.ok?'ok':'errore'),
    el('span','prev',(e.command||'').split(String.fromCharCode(10))[0]));
  if(e.diff){ const ds = el('span','ds'); ds.append(el('span','a','+'+e.add), el('span','d','-'+e.del)); head.append(ds); }
  head.append(el('span','time',e.ts+' · '+e.ms+' ms'));
  box.append(head, el('div','lbl', e.diff ? 'File' : 'Comando / argomenti'), el('pre','cmd',e.command));
  if(e.diff){
    const pre = el('pre','diff'), nl = String.fromCharCode(10);
    e.diff.forEach(l => pre.append(el('span', {'+':'a','-':'d','@':'h'}[l[0]] || null, l + nl)));
    box.append(el('div','lbl','Diff'), pre);
  } else box.append(el('div','lbl','Output'), el('pre',null,e.stdout||'(vuoto)'));
  if(e.stderr){ box.append(el('div','lbl','Stderr'), el('pre','stderr',e.stderr)); }
  return box;
}
const fTool = document.getElementById('f-tool'), fState = document.getElementById('f-state');
let savedTool = localStorage.getItem('tv_f_tool') || ''; fState.value = localStorage.getItem('tv_f_state') || '';
function base(){ return (filterKeys && onlyChat) ? all.filter(e => filterKeys.has(e.key)) : all; }
function visible(){
  const t = fTool.value, s = fState.value;
  return base().filter(e => (!t || e.tool === t) && (!s || (s === 'ok') === !!e.ok));
}
function fillTools(b){
  const n = {}; b.forEach(e => { n[e.tool] = (n[e.tool] || 0) + 1; });
  const cur = fTool.value || savedTool; savedTool = ''; if(cur && !(cur in n)) n[cur] = 0;
  const opts = [new Option('Tutti i tool (' + b.length + ')', '')];
  Object.keys(n).sort((a, z) => n[z] - n[a]).forEach(k => opts.push(new Option(k + ' (' + n[k] + ')', k)));
  fTool.replaceChildren(...opts); fTool.value = cur;
  const ko = b.filter(e => !e.ok).length;
  fState.options[1].text = 'ok (' + (b.length - ko) + ')'; fState.options[2].text = 'errore (' + ko + ')';
}
function draw(){
  const b = base(); fillTools(b);
  const v = visible(), list = document.getElementById('list'), filtered = !!(filterKeys && onlyChat);
  list.replaceChildren(...v.slice(-200).reverse().map(renderOne));
  const empty = document.getElementById('empty');
  empty.textContent = (b.length && !v.length) ? 'Nessuna chiamata con questi filtri.' : filtered ? 'Nessuna chiamata registrata per questa chat.' : 'Nessuna chiamata registrata finora.';
  empty.style.display = v.length ? 'none' : 'block';
  document.getElementById('count').textContent = filtered ? (v.length + ' di ' + all.length + ' chiamate (questa chat)') : (all.length + ' chiamate registrate');
  const m = document.getElementById('mode');
  m.style.display = filterKeys ? 'inline-block' : 'none';
  m.textContent = onlyChat ? 'Mostra tutte' : 'Solo questa chat';
  // la pagina che ci incorpora mostra conteggio e scelta "chat / tutte" nella propria intestazione
  if(window.parent !== window) parent.postMessage({type:'tm-viewer-status', shown: v.length, total: all.length,
    filtered: filtered, filterable: !!filterKeys, onlyChat: onlyChat}, parentOrigin);
}
async function poll(){
  try{
    const r = await fetch('/log?since='+since+'&epoch='+encodeURIComponent(epoch)); const d = await r.json();
    const firstLoad = !loaded;
    if(d.reset){ all = []; openState.clear(); }
    d.entries.forEach((e, k) => { e._i = all.length + k; });
    all = all.concat(d.entries);
    since = d.total; epoch = d.epoch; loaded = true;
    // avvisa la pagina che ci incorpora (solo lei) delle chiamate arrivate dopo il primo caricamento
    if(!firstLoad && !d.reset && d.entries.length && window.parent !== window){
      parent.postMessage({type:'tm-viewer-new', keys: d.entries.map(e => e.key)}, parentOrigin);
    }
    if(firstLoad || d.reset || d.entries.length) draw();   // ridisegna solo se qualcosa e' cambiato
  }catch(err){
    document.getElementById('count').textContent = 'server non raggiungibile';
    if(window.parent !== window) parent.postMessage({type:'tm-viewer-status', error: true}, parentOrigin);
  }
}
window.addEventListener('message', ev => {
  let ok = false;
  try { const h = new URL(ev.origin).hostname; ok = h === 'typingmind.com' || h.endsWith('.typingmind.com'); } catch(e){}
  if(!ok) return;
  const d = ev.data;
  if(!d) return;
  if(d.type === 'tm-chat-filter'){
    filterKeys = Array.isArray(d.keys) ? new Set(d.keys) : null;
    if(typeof d.onlyChat === 'boolean') onlyChat = d.onlyChat;     // la scelta resta all'estensione: l'iframe si ricarica a ogni cambio chat
    draw();
  } else if(d.type === 'tm-set-mode'){ onlyChat = !!d.onlyChat; draw(); }
  else if(d.type === 'tm-theme'){
    document.documentElement.classList.toggle('dark', !!d.dark);
    if(typeof d.bg === 'string' && /^rgb[(][0-9, ]+[)]$/.test(d.bg)) document.documentElement.style.setProperty('--bg', d.bg);
  }
});
document.getElementById('mode').onclick = () => { onlyChat = !onlyChat; draw(); };
fTool.onchange = () => { localStorage.setItem('tv_f_tool', fTool.value); draw(); };
fState.onchange = () => { localStorage.setItem('tv_f_state', fState.value); draw(); };
if(window.parent !== window) parent.postMessage({type:'tm-viewer-ready'}, '*');
poll(); setInterval(poll, 1000);
</script></body></html>"""

def sig(args):
    """Chiave di abbinamento con la chat: stessa formula di sigOf() nell'estensione."""
    if isinstance(args, dict) and "command" in args:
        return json.dumps([args.get("command"), args.get("description") or ""], ensure_ascii=False, separators=(",", ":"))
    return json.dumps(args, sort_keys=True, ensure_ascii=False, separators=(",", ":"))

def flatten(raw):
    e = json.loads(raw)
    args, res = e.get("arguments") or {}, e.get("result")
    command = args.get("command") if isinstance(args, dict) and "command" in args else json.dumps(args, ensure_ascii=False)
    stdout, stderr, ok = "", "", True
    try:
        text = res["content"][0]["text"]
        try:
            inner = json.loads(text)
            stdout, stderr = inner.get("stdout", ""), inner.get("stderr", "")
            ok = not stderr and not inner.get("interrupted", False)
        except ValueError:
            stdout = text
        if isinstance(res, dict) and res.get("isError"):
            ok = False
    except Exception:
        stdout, ok = json.dumps(res, ensure_ascii=False), False
    out = {"ts": e.get("ts", ""), "ms": e.get("ms", 0), "tool": e.get("tool", "?"),
           "command": command, "stdout": stdout, "stderr": stderr, "ok": ok, "key": sig(args)}
    try:
        inner = json.loads(res["content"][0]["text"])
        patch = inner.get("structuredPatch")
        if ok and isinstance(patch, list) and inner.get("filePath"):
            lines = []
            for h in patch:
                lines.append("@@ -%s,%s +%s,%s @@" % (h["oldStart"], h["oldLines"], h["newStart"], h["newLines"]))
                lines.extend(h["lines"])
            if not patch and inner.get("type") == "create":
                lines = ["+" + l for l in (inner.get("content") or "").splitlines()]
            out.update(command=inner["filePath"], stdout="", diff=lines,
                       add=sum(1 for l in lines if l[:1] == "+"), **{"del": sum(1 for l in lines if l[:1] == "-")})
    except Exception:
        pass
    return out

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, ctype, body):
        b = body.encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(b))); self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            return self.send(200, "text/html", PAGE)
        if u.path == "/log":
            since = int(parse_qs(u.query).get("since", ["0"])[0])
            lines = open(LOG, encoding="utf-8").read().splitlines() if os.path.exists(LOG) else []
            lines = [l for l in lines if l.strip()]
            # epoch = impronta della prima riga: cambia quando il proxy accorcia il file (rotazione)
            epoch = hashlib.md5(lines[0].encode("utf-8")).hexdigest()[:8] if lines else ""
            client_epoch = parse_qs(u.query).get("epoch", [""])[0]
            # reset: log azzerato/accorciato oltre il cursore, oppure rotazione (epoch cambiato): il client riparte da zero
            reset = since > len(lines) or (bool(client_epoch) and client_epoch != epoch)
            if reset:
                since = 0
            entries = []
            for l in lines[since:]:
                try: entries.append(flatten(l))
                except Exception: pass
            return self.send(200, "application/json", json.dumps({"total": len(lines), "reset": reset, "epoch": epoch, "entries": entries}, ensure_ascii=False))
        if u.path in ("/ext.js", "/ext.js.map"):
            try:
                ctype = "application/json" if u.path.endswith(".map") else "application/javascript"
                return self.send(200, ctype, open(EXT + (".map" if u.path.endswith(".map") else ""), encoding="utf-8").read())
            except OSError:
                return self.send(404, "text/plain", "ext non trovata")
        self.send(404, "text/plain", "not found")

if __name__ == "__main__":
    print(f"Viewer su http://127.0.0.1:{PORT}  (log: {LOG})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
