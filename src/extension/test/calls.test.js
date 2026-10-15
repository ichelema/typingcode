// bun test (dalla cartella src/extension): funzioni pure dell'estensione.
// chat-sample.json = struttura dei messaggi reali di una chat di TypingMind, con testi, percorsi e id sostituiti.
import { test, expect } from 'bun:test';
import { callsFromChat, chatIdFromHash, clampW } from '../src/calls.js';
import sample from './chat-sample.json';

const calls = callsFromChat(sample);
const byId = Object.fromEntries(calls.map((c) => [c.id, c]));

test('callsFromChat: una voce per chiamata, in ordine, anche con due chiamate nello stesso messaggio', () => {
  expect(calls.map((c) => c.id)).toEqual(['toolu_bash_ok', 'toolu_bash_exit', 'toolu_bash_stderr', 'toolu_pw_ok', 'toolu_pw_err',
    'toolu_edit', 'toolu_write_omit', 'toolu_write_full', 'toolu_read_err', 'toolu_pending']);
});

test('Bash: input = comando, stdout e stderr separati, durata da toolExecution', () => {
  expect(byId.toolu_bash_ok).toMatchObject({ tool: 'Bash', input: 'git status --short', out: ' M ext.js\n?? publish.sh', err: '', ok: true, done: true, ms: 2989 });
  expect(byId.toolu_bash_ok.ts).toMatch(/^2026-10-14T/);
  expect(byId.toolu_bash_stderr).toMatchObject({ out: 'a.js\nb.js', ok: false });
  expect(byId.toolu_bash_stderr.err).toContain('Shell cwd was reset');
});

test('errori riconosciuti dal testo e da format "error"', () => {
  expect(byId.toolu_bash_exit).toMatchObject({ ok: false, err: '' });
  expect(byId.toolu_bash_exit.out).toStartWith('Exit code 1');
  expect(byId.toolu_pw_err.ok).toBe(false);
  expect(byId.toolu_read_err).toMatchObject({ ok: false, out: 'Error: MCP server not connected', done: true });
});

test('altri server MCP: input = JSON degli argomenti, output = testo', () => {
  expect(byId.toolu_pw_ok).toMatchObject({ tool: 'browser_evaluate', input: '{"function":"() => location.href"}', ok: true });
  expect(byId.toolu_pw_ok.out).toStartWith('### Result');
});

test('Edit: diff da structuredPatch con +N -M', () => {
  expect(byId.toolu_edit).toMatchObject({ file: 'C:/progetto/a.js', out: '', add: 2, del: 1,
    diff: ['@@ -3,1 +3,2 @@', '-const a = 1;', '+const a = 2;', '+const b = 3;'] });
});

test('Write create: righe + dal contenuto, o dagli argomenti se il proxy lo ha omesso', () => {
  expect(byId.toolu_write_omit).toMatchObject({ file: 'C:/progetto/nuovo.md', diff: ['+# Titolo', '+', '+riga due'], add: 3, del: 0 });
  expect(byId.toolu_write_full).toMatchObject({ diff: ['+uno', '+due'], add: 2 });
});

test('chiamata senza risposta: done false, nessuna durata', () => {
  expect(byId.toolu_pending).toMatchObject({ tool: 'Bash', input: 'sleep 15', done: false, ms: null, out: '' });
});

test('input mancante o chat vuota', () => {
  expect(callsFromChat(null)).toEqual([]);
  expect(callsFromChat({ messages: [{ role: 'tool', tool_call_id: 'x', name: 'Read', content: [{ type: 'text', text: 'ok' }],
    pluginResponse: { inputParams: { file_path: 'a' } } }] })).toMatchObject([{ id: 'x', tool: 'Read', input: '{"file_path":"a"}', out: 'ok', ms: null }]);
  expect(callsFromChat({ messages: [{ tool_calls: [{ id: 'y', function: { name: 'Bash', arguments: 'non json' } }] }] }))
    .toMatchObject([{ id: 'y', input: '{}', done: false }]);
});

test('chatIdFromHash e clampW', () => {
  expect(chatIdFromHash('#chat=ab%20c&x=1')).toBe('ab c');
  expect(chatIdFromHash('#settings')).toBe(null);
  expect(clampW(10)).toBe(320);
  expect(clampW(5000)).toBe(900);
  expect(clampW(NaN)).toBe(450);
});
