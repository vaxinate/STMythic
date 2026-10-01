import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKIPPED_EVENT_PROMPT, escapeMarkdown, eventDisplay, eventPrompt } from '../src/randomEvent.js';

const event = { focus: 'NPC Action', word1: 'Betray', word2: 'Plans', notes: '' };

test('eventPrompt includes filled fields only', () => {
    assert.equal(eventPrompt(event),
        'Random event — Event Focus: NPC Action; Meaning: Betray / Plans. Introduce it now, interpreting the meaning words in context.');
    assert.match(eventPrompt({ focus: '', word1: 'Ruin', word2: '', notes: 'the bridge' }), /Meaning: Ruin; Notes: the bridge/);
});

test('skipped event', () => {
    assert.equal(eventPrompt(null), SKIPPED_EVENT_PROMPT);
    assert.match(eventDisplay(null), /skipped/);
});

test('display escapes markdown from player input', () => {
    assert.equal(escapeMarkdown('*bold* <b> _i_'), '&#42;bold&#42; &lt;b&gt; &#95;i&#95;');
    assert.equal(eventDisplay(event), '⚡ **Random event:** NPC Action — Betray / Plans');
});
