import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInjection, pendingResults } from '../src/chat.js';
import { MODULE_NAME } from '../src/state.js';

const user = (mes) => ({ is_user: true, is_system: false, mes });
const bot = (mes) => ({ is_user: false, is_system: false, mes });
const result = (prompt) => ({ is_user: false, is_system: true, extra: { [MODULE_NAME]: { prompt } } });
const toolCall = () => ({ is_user: false, is_system: true, extra: { tool_invocations: [] } });

test('results after the last bot reply are pending, in order', () => {
    const chat = [bot('hi'), result('old'), bot('reply'), result('a'), user('I open the door'), result('b')];
    assert.deepEqual(pendingResults(chat, 'normal'), ['a', 'b']);
});

test('nothing pending once the bot has replied', () => {
    assert.deepEqual(pendingResults([result('a'), bot('reply')], 'normal'), []);
});

test('swipe ignores the reply being replaced', () => {
    const chat = [bot('hi'), result('a'), user('go'), bot('reply to swipe')];
    assert.deepEqual(pendingResults(chat, 'swipe'), ['a']);
});

test('tool-call system messages do not end the pending window', () => {
    const chat = [bot('hi'), result('a'), user('go'), toolCall()];
    assert.deepEqual(pendingResults(chat, 'normal'), ['a']);
});

test('buildInjection is empty with no results and binding otherwise', () => {
    assert.equal(buildInjection([]), '');
    const text = buildInjection(['Fate: Yes.']);
    assert.match(text, /binding/);
    assert.match(text, /Fate: Yes\./);
});
