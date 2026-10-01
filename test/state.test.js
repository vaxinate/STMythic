import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DESCRIPTION_TEMPLATE, DEFAULT_FATE_DESCRIPTION, DEFAULT_NUDGE_TEXT, MODULE_NAME, clampMaxConsults, clampThreshold, getSettings } from '../src/state.js';

const OLD_DEFAULT = `Request a roll on a Mythic GME 2e table. The player will look up the result in the book.
Use when you need inspiration you shouldn't invent yourself. Interpret results in context, not literally.
Only these tables are available:
{{tables}}`;

const withSettings = (saved) => {
    const extensionSettings = saved ? { [MODULE_NAME]: saved } : {};
    globalThis.SillyTavern = { getContext: () => ({ extensionSettings }) };
};

test('unedited old table template migrates to the new default', () => {
    withSettings({ descriptionTemplate: OLD_DEFAULT });
    assert.equal(getSettings().descriptionTemplate, DEFAULT_DESCRIPTION_TEMPLATE);
});

const CR001_FATE = `Ask the Mythic oracle a yes/no question about the world. Never use it for the PC's own actions; those are skill checks.
REQUIRED before narrating any of these as true:
- an NPC knows, has, or agrees to something the PC needs
- a route, door, guard, system, or opportunity is open, absent, or unaware
- timing or luck favors the PC
- the player asks about the world and the answer isn't already established
- an NPC or companion makes a choice that matters and isn't dictated by the fiction
Never answer these yourself. Pick odds from the fiction; when the answer helps the PC, default to unlikely.
The answer is binding.`;

test('unedited CR-001 defaults migrate to the toned-down text', () => {
    withSettings({ fateDescription: CR001_FATE, nudgeText: 'custom nudge' });
    const s = getSettings();
    assert.equal(s.fateDescription, DEFAULT_FATE_DESCRIPTION);
    assert.match(s.fateDescription, /single most important uncertainty/);
    assert.equal(s.nudgeText, 'custom nudge');
    assert.notEqual(DEFAULT_NUDGE_TEXT, 'custom nudge');
});

test('edited table template is preserved', () => {
    withSettings({ descriptionTemplate: `${OLD_DEFAULT}\nPrefer Actions.` });
    assert.equal(getSettings().descriptionTemplate, `${OLD_DEFAULT}\nPrefer Actions.`);
});

test('new settings get CR-001 defaults', () => {
    withSettings({ tables: 'Actions' });
    const s = getSettings();
    assert.equal(s.fateDescription, DEFAULT_FATE_DESCRIPTION);
    assert.equal(s.nudgeEnabled, true);
    assert.equal(s.nudgeThreshold, 3);
    assert.equal(s.showIdleCounter, true);
    assert.equal(s.maxConsultsPerReply, 1);
    assert.equal(s.tables, 'Actions');
});

test('clampMaxConsults keeps 1–5', () => {
    assert.deepEqual([0, 1, 2.4, 9, 'x'].map(clampMaxConsults), [1, 1, 2, 5, 1]);
});

test('clampThreshold keeps 1–10', () => {
    assert.deepEqual([0, 1, 4.6, 11, 'x'].map(clampThreshold), [1, 1, 5, 10, 3]);
});
