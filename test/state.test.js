import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DESCRIPTION_TEMPLATE, DEFAULT_FATE_DESCRIPTION, MODULE_NAME, clampThreshold, getSettings } from '../src/state.js';

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
    assert.equal(s.tables, 'Actions');
});

test('clampThreshold keeps 1–10', () => {
    assert.deepEqual([0, 1, 4.6, 11, 'x'].map(clampThreshold), [1, 1, 5, 10, 3]);
});
