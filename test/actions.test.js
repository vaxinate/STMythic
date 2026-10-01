import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chaosAction, fateAction, sceneAction } from '../src/actions.js';

let context;
beforeEach(() => {
    context = { chatMetadata: {}, saveMetadataDebounced() {} };
    globalThis.SillyTavern = { getContext: () => context };
});

const fixed = (value, sides) => () => (value - 1) / sides;

test('sceneAction keeps the planned scene out of the display', () => {
    const r = sceneAction('The party reaches the ruined keep at dusk.', fixed(3, 10));
    assert.equal(r.result, 'Altered');
    assert.doesNotMatch(r.display, /keep/);
    assert.match(r.prompt, /^Scene check: Altered\. Expected scene: “The party reaches the ruined keep at dusk\.”\. /);
});

test('chaosAction clamps and reports no-change', () => {
    context.chatMetadata.mythic_oracle = { cf: 9 };
    const r = chaosAction(1, 'PC lost control');
    assert.deepEqual([r.from, r.to], [9, 9]);
    assert.equal(r.prompt, 'Chaos Factor stays at 9.');
    assert.match(r.display, /stays at 9 — PC lost control/);
    const down = chaosAction(-1);
    assert.equal(down.prompt, 'Chaos Factor 9 → 8.');
    assert.equal(context.chatMetadata.mythic_oracle.cf, 8);
});

test('fateAction without a random event needs no popup', async () => {
    const r = await fateAction('likely', 'Is it raining?', fixed(40, 100));
    assert.equal(r.answer, 'Yes');
    assert.equal(r.event, null);
    assert.equal(r.prompt, 'Fate question “Is it raining?” (Likely): Yes.');
});
