// bun test (dalla cartella src/extension): funzioni pure condivise con il viewer Python.
import { test, expect } from 'bun:test';
import { canon, sigOf, keysFromChat, chatIdFromHash, clampW } from '../src/sig.js';

test('sigOf: Bash usa [command, description]', () => {
  expect(sigOf({ command: 'ls', description: 'lista' })).toBe('["ls","lista"]');
  expect(sigOf({ command: 'ls' })).toBe('["ls",""]');
});

test('sigOf: altri tool usano JSON con chiavi ordinate', () => {
  expect(sigOf({ b: 1, a: { d: 2, c: [3] } })).toBe('{"a":{"c":[3],"d":2},"b":1}');
  expect(canon(null)).toBe('null');
});

test('keysFromChat: tool_calls (stringa JSON) e pluginResponse, senza duplicati', () => {
  const chat = { messages: [
    { tool_calls: [{ function: { arguments: '{"command":"ls","description":"x"}' } }] },
    { pluginResponse: { inputParams: { command: 'ls', description: 'x' } } },
    { tool_calls: [{ function: { arguments: 'non json' } }] },
    { pluginResponse: { inputParams: { file_path: 'a' } } },
  ] };
  expect(keysFromChat(chat)).toEqual(['["ls","x"]', '{"file_path":"a"}']);
  expect(keysFromChat(null)).toEqual([]);
});

test('chatIdFromHash e clampW', () => {
  expect(chatIdFromHash('#chat=ab%20c&x=1')).toBe('ab c');
  expect(chatIdFromHash('#settings')).toBe(null);
  expect(clampW(10)).toBe(320);
  expect(clampW(5000)).toBe(900);
  expect(clampW(NaN)).toBe(450);
});
