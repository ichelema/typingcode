r"""Proxy MCP stdio che registra ogni tools/call in proxy_log.jsonl (v2: registra anche i metadati).

Uso:
  mcp_proxy.py <comando> [argomenti...]   -> avvolge il comando (es. claude mcp serve), ambiente e cwd ereditati
Variabile opzionale: MCP_PROXY_LOG = percorso del log (default C:\Download\test\logs\proxy_log.jsonl)
Novita' v2: ogni voce ha pid/started del proxy, rpc_id ed 'extra' (campi di params oltre name/arguments, es. _meta).
            Gli altri messaggi del client (initialize, tools/list, notifiche) vanno in <log>_meta.jsonl.
Novita' v4: rotazione. MCP_PROXY_KEEP (default 500 righe), MCP_PROXY_KEEP_META (200), MCP_PROXY_MAX_MB (5),
            MCP_PROXY_ROTATE_EVERY (25 scritture tra un controllo e l'altro). Taglio netto all'avvio.
"""
import sys, os, re, json, subprocess, threading, time, shutil

LOG = os.environ.get("MCP_PROXY_LOG", r"C:\Download\test\logs\proxy_log.jsonl")
META = os.path.splitext(LOG)[0] + "_meta.jsonl"
os.makedirs(os.path.dirname(LOG), exist_ok=True)   # senza cartella write() ignora l'errore e il log si perde
PID = os.getpid()
STARTED = time.strftime("%Y-%m-%d %H:%M:%S")
sys.stdin.reconfigure(encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8", newline="\n")

if len(sys.argv) < 2:
    sys.exit("Uso: mcp_proxy.py <comando> [argomenti...]   (es. mcp_proxy.py claude mcp serve)")
cmd = sys.argv[1:]
cmd[0] = shutil.which(cmd[0]) or cmd[0]
child = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=None,
                         text=True, encoding="utf-8")

pending, lock = {}, threading.Lock()

# v5: regole per risparmiare token, iniettate nelle risposte del server (disattivabili con MCP_PROXY_NO_HINTS=1).
# Vanno in tools/list (descrizione dei tool: il client le legge sempre) e in initialize.instructions.
HINTS_ON = os.environ.get("MCP_PROXY_NO_HINTS") != "1"
RULES_FILE = os.environ.get("MCP_PROXY_RULES", "C:/Download/test/src/mcp/core-behavior.md")
try:
    with open(RULES_FILE, encoding="utf-8") as _f:
        FULL_RULES = _f.read().strip()
except Exception:
    FULL_RULES = ""
# Sintesi breve (rimandata a ogni turno nella descrizione di Bash); le regole complete vanno in initialize.instructions.
RULES = ("REGOLE (complete in " + RULES_FILE + ", leggile a inizio sessione con Read): "
         "script non banali in JavaScript .mjs eseguiti con bun, in una sottocartella di $HOME/.claude/tmp, con log ed esito PASS/FAIL; "
         "Edit per modifiche puntuali (il proxy toglie la copia del file dalla risposta); script bun solo per modifiche estese o ripetute; "
         "Read con offset/limit, ricerche con Grep/Glob; output shell sempre accorciato; niente immagini in chat; "
         "a ogni passo significativo aggiorna C:/Download/test/RECAP_sessione.md (sez. 6, 7, 7c); per riprendere leggi le sez. 6 e 7.")
TOOL_HINTS = {
    "Bash": RULES,
    "Read": "Leggi solo il necessario: usa offset/limit; per cercare testo usa Grep.",
    "Edit": "Usalo per modifiche puntuali: la risposta contiene solo il diff (il proxy toglie originalFile).",
    "Write": "Per riscritture complete o file nuovi; per modifiche puntuali usa Edit.",
}
rewrite = {}   # rpc_id -> metodo da modificare nella risposta

# v6: le risposte di Edit/Write/MultiEdit contengono il file intero prima della modifica (originalFile) e, per Write,
# il contenuto appena inviato: resta nel contesto a ogni turno. Il log li conserva; al client arrivano solo diff e percorso.
SLIM_ON = os.environ.get("MCP_PROXY_NO_SLIM") != "1"
SLIM_TOOLS = {"Edit", "Write", "MultiEdit"}
SLIM_KEYS = ("originalFile", "content")

# v7: blocca i comandi Bash distruttivi prima che arrivino al server (disattivabile con MCP_PROXY_NO_GUARD=1).
# Sblocco puntuale: il comando contiene GUARD_ALLOW, da usare solo dopo conferma esplicita dell'utente.
GUARD_ON = os.environ.get("MCP_PROXY_NO_GUARD") != "1"
GUARD_ALLOW = "# proxy:allow"
_SEG = r"[^;&|\n]*"
GUARD_RULES = (
    ("git push --force", re.compile(r"\bgit\b" + _SEG + r"\spush\b" + _SEG + r"\s(--force\S*|-[a-zA-Z]*f[a-zA-Z]*|\+\S+)(?=\s|$)")),
    ("git reset --hard", re.compile(r"\bgit\b" + _SEG + r"\sreset\b" + _SEG + r"\s--hard\b")),
)
_RM = re.compile(r"(?:^|[;&|(`\s])rm\s+(" + _SEG + ")")

def guard_check(cmd):
    if not GUARD_ON or not isinstance(cmd, str) or GUARD_ALLOW in cmd:
        return None
    for m in _RM.finditer(cmd):
        flags = [t for t in m.group(1).split() if t.startswith("-")]
        shorts = "".join(t[1:] for t in flags if not t.startswith("--")).lower()
        if ("r" in shorts or "--recursive" in flags) and ("f" in shorts or "--force" in flags):
            return "rm -rf"
    for label, rx in GUARD_RULES:
        if rx.search(cmd):
            return label
    return None

def guard_reply(rid, label, cmd):
    text = ("BLOCCATO dal proxy MCP: comando distruttivo (" + label + "), NON eseguito.\n"
            "Comando: " + cmd[:300] + "\n"
            "Chiedi conferma esplicita all'utente. Solo se conferma, ripeti il comando identico aggiungendo in fondo "
            "'" + GUARD_ALLOW + "'.")
    return {"jsonrpc": "2.0", "id": rid, "result": {"content": [{"type": "text", "text": text}], "isError": True}}

out_lock = threading.Lock()   # stdout verso il client: scritto da entrambi i thread

def emit(line):
    with out_lock:
        sys.stdout.write(line if line.endswith("\n") else line + "\n")
        sys.stdout.flush()

def slim_result(tool, msg):
    if not SLIM_ON or tool not in SLIM_TOOLS:
        return False
    changed = False
    for c in (msg.get("result") or {}).get("content") or []:
        try:
            inner = json.loads(c["text"])
        except Exception:
            continue
        if not isinstance(inner, dict):
            continue
        drop = [k for k in SLIM_KEYS if inner.get(k) is not None]
        if drop:
            for k in drop:
                inner[k] = "(omesso dal proxy)"
            c["text"] = json.dumps(inner, ensure_ascii=False)
            changed = True
    return changed

def add_hints(method, msg):
    res = msg.get("result")
    if not isinstance(res, dict):
        return False
    if method == "tools/list":
        changed = False
        for t in res.get("tools") or []:
            h = TOOL_HINTS.get(t.get("name"))
            if h and h not in (t.get("description") or ""):
                t["description"] = ((t.get("description") or "") + "\n\n" + h).strip()
                changed = True
        return changed
    if method == "initialize":
        res["instructions"] = ((res.get("instructions") or "") + "\n\n" + (FULL_RULES or RULES)).strip()
        return True
    return False

# ---- rotazione dei log (v4) ----
# Si tengono le ultime KEEP righe e comunque al massimo MAX_MB megabyte. Configurabile da ambiente.
def _env_int(name, default):
    try:
        return max(1, int(os.environ.get(name, default)))
    except ValueError:
        return default

KEEP = _env_int("MCP_PROXY_KEEP", 500)                  # righe tenute in proxy_log.jsonl
KEEP_META = _env_int("MCP_PROXY_KEEP_META", 200)        # righe tenute in proxy_log_meta.jsonl
MAX_BYTES = _env_int("MCP_PROXY_MAX_MB", 5) * 1024 * 1024
ROTATE_EVERY = _env_int("MCP_PROXY_ROTATE_EVERY", 25)   # ogni quante scritture controllare
_writes = {}

def rotate(path, keep, slack=0):
    """Riscrive `path` tenendo le ultime `keep` righe (e al massimo MAX_BYTES). Scrive in un file temporaneo e lo
    sostituisce con os.replace. Con slack>0 interviene solo se le righe superano keep+slack (evita riscritture continue).
    Non lancia mai eccezioni: se non riesce (file aperto da altri), riprova al controllo successivo."""
    tmp = path + ".tmp"
    try:
        if not os.path.exists(path):
            return False
        with open(path, "rb") as f:
            lines = f.read().splitlines(keepends=True)
        total = sum(len(l) for l in lines)
        if len(lines) <= keep + slack and total <= MAX_BYTES:
            return False
        n_before = len(lines)
        lines = lines[-keep:]
        total = sum(len(l) for l in lines)
        drop = 0
        while drop < len(lines) - 1 and total > MAX_BYTES:       # almeno l'ultima riga resta sempre
            total -= len(lines[drop]); drop += 1
        lines = lines[drop:]
        if len(lines) == n_before:                               # niente da togliere (es. una sola riga enorme)
            return False
        with open(tmp, "wb") as f:
            f.writelines(lines)
        os.replace(tmp, path)
        return True
    except Exception:
        try:
            os.remove(tmp)
        except Exception:
            pass
        return False

def write(path, entry):
    try:
        with lock:
            with open(path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            _writes[path] = _writes.get(path, 0) + 1
            if _writes[path] % ROTATE_EVERY == 0:
                keep = KEEP_META if path == META else KEEP
                rotate(path, keep, max(1, keep // 5))
    except Exception:
        pass                                # il logging non deve mai rompere il server

def short(obj, limit=3000):
    s = json.dumps(obj, ensure_ascii=False)
    return obj if len(s) <= limit else s[:limit] + "...[troncato]"

def client_to_child():
    for line in sys.stdin:
        try:
            msg = json.loads(line)
            if msg.get("method") == "tools/call":
                p = msg.get("params") or {}
                extra = {k: v for k, v in p.items() if k not in ("name", "arguments")}
                args = p.get("arguments") if isinstance(p.get("arguments"), dict) else {}
                label = guard_check(args.get("command")) if p.get("name") == "Bash" else None
                if label:
                    reply = guard_reply(msg.get("id"), label, args["command"])
                    write(LOG, {"ts": time.strftime("%Y-%m-%d %H:%M:%S"), "tool": "Bash", "arguments": args,
                                "result": reply["result"], "ms": 0, "pid": PID, "started": STARTED,
                                "rpc_id": msg.get("id"), "extra": extra, "blocked": label})
                    emit(json.dumps(reply, ensure_ascii=False))
                    continue
                with lock:
                    pending[msg["id"]] = {"tool": p.get("name"), "arguments": p.get("arguments"),
                                          "extra": extra, "t0": time.time()}
            elif "method" in msg:
                if HINTS_ON and msg["method"] in ("tools/list", "initialize") and "id" in msg:
                    with lock:
                        rewrite[msg["id"]] = msg["method"]
                write(META, {"ts": time.strftime("%Y-%m-%d %H:%M:%S"), "pid": PID, "started": STARTED,
                             "method": msg["method"], "rpc_id": msg.get("id"), "params": short(msg.get("params"))})
        except Exception:
            pass
        child.stdin.write(line if line.endswith("\n") else line + "\n")
        child.stdin.flush()
    try:
        child.stdin.close()
    except Exception:
        pass

def child_to_client():
    for line in child.stdout:
        try:
            msg = json.loads(line)
            with lock:
                req = pending.pop(msg.get("id"), None) if "id" in msg and "method" not in msg else None
                rw = rewrite.pop(msg.get("id"), None) if "id" in msg and "method" not in msg else None
            if rw and add_hints(rw, msg):
                line = json.dumps(msg, ensure_ascii=False) + "\n"
            if req:
                write(LOG, {"ts": time.strftime("%Y-%m-%d %H:%M:%S"), "tool": req["tool"], "arguments": req["arguments"],
                            "result": msg.get("result", msg.get("error")), "ms": int((time.time() - req["t0"]) * 1000),
                            "pid": PID, "started": STARTED, "rpc_id": msg.get("id"), "extra": req["extra"]})
                if slim_result(req["tool"], msg):   # dopo il log: il log tiene la risposta completa
                    line = json.dumps(msg, ensure_ascii=False) + "\n"
        except Exception:
            pass
        emit(line)

def ensure_viewer():
    """Avvia il viewer (log_viewer.py) se la porta 8765 non risponde. Staccato dal proxy: sopravvive alla sua chiusura.
    Disattivabile con la variabile d'ambiente MCP_PROXY_NO_VIEWER=1. Non deve mai rompere il server MCP."""
    try:
        import socket
        try:
            socket.create_connection(("127.0.0.1", 8765), timeout=0.5).close()
            return                                  # gia' attivo
        except OSError:
            pass
        py = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
        if not os.path.exists(py):
            py = r"D:\msys64\ucrt64\bin\pythonw.exe"
        flags = 0x00000008 | 0x00000200 | 0x08000000   # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW
        subprocess.Popen([py, r"C:\Download\test\src\mcp\log_viewer.py"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, creationflags=flags, close_fds=True)
    except Exception:
        pass

with lock:                                  # all'avvio: taglio netto (slack=0) dei log gia' troppo lunghi
    rotate(LOG, KEEP)
    rotate(META, KEEP_META)

if not os.environ.get("MCP_PROXY_NO_VIEWER"):
    threading.Thread(target=ensure_viewer, daemon=True).start()

t1 = threading.Thread(target=client_to_child, daemon=True); t1.start()
t2 = threading.Thread(target=child_to_client, daemon=True); t2.start()
t1.join()
time.sleep(1)
child.terminate()
