import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narratorMessagesSinceConsult, nudgeFor } from '../src/nudge.js';
import { MODULE_NAME } from '../src/state.js';

const user = () => ({ is_user: true, is_system: false });
const bot = () => ({ is_user: false, is_system: false });
const hidden = () => ({ is_user: false, is_system: true });
const tools = (...names) => ({ is_user: false, is_system: true, extra: { tool_invocations: names.map(name => ({ name })) } });
const playerRoll = () => ({ is_user: false, is_system: true, extra: { [MODULE_NAME]: { prompt: 'Fate: Yes.' } } });

const settings = { nudgeEnabled: true, nudgeThreshold: 3, nudgeText: 'Idle for {{count}}, {{user}}.' };

test('counts narrator messages back to the last fate or table call', () => {
    const chat = [bot(), tools('mythic_fate'), bot(), user(), bot(), user()];
    assert.equal(narratorMessagesSinceConsult(chat, 'normal'), 2);
    assert.equal(narratorMessagesSinceConsult([tools('mythic_table'), bot()], 'normal'), 1);
    assert.equal(narratorMessagesSinceConsult([bot(), user(), bot()], 'normal'), 2);
});

test('scene, chaos and player rolls do not reset; system and hidden messages do not count', () => {
    const chat = [tools('mythic_fate'), bot(), tools('mythic_scene', 'mythic_chaos'), bot(), playerRoll(), hidden(), bot()];
    assert.equal(narratorMessagesSinceConsult(chat, 'normal'), 3);
});

test('a batch containing fate resets even alongside other tools', () => {
    assert.equal(narratorMessagesSinceConsult([bot(), tools('mythic_scene', 'mythic_fate')], 'normal'), 0);
});

test('swipe excludes the reply being regenerated', () => {
    const chat = [tools('mythic_fate'), bot(), user(), bot(), user(), bot()];
    assert.equal(narratorMessagesSinceConsult(chat, 'normal'), 3);
    assert.equal(narratorMessagesSinceConsult(chat, 'swipe'), 2);
});

test('threshold 3: silent for messages 1–3, fires for message 4 onward', () => {
    // count = narrator messages already in chat; the generation produces message count + 1
    assert.equal(nudgeFor(settings, 0, 'normal'), '');
    assert.equal(nudgeFor(settings, 2, 'normal'), '');
    assert.equal(nudgeFor(settings, 3, 'normal'), 'Idle for 3, {{user}}.');
    assert.equal(nudgeFor(settings, 7, 'normal'), 'Idle for 7, {{user}}.');
});

test('skips quiet and impersonate, respects the switch, and resolves macros', () => {
    assert.equal(nudgeFor(settings, 5, 'quiet'), '');
    assert.equal(nudgeFor(settings, 5, 'impersonate'), '');
    assert.equal(nudgeFor({ ...settings, nudgeEnabled: false }, 5, 'normal'), '');
    assert.equal(nudgeFor(settings, 3, 'swipe', t => t.replace('{{user}}', 'Ada')), 'Idle for 3, Ada.');
    assert.equal(nudgeFor({ ...settings, nudgeThreshold: 0 }, 1, 'normal'), 'Idle for 1, {{user}}.');
});
