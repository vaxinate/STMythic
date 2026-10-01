import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_NOT_ENDED, lastSceneEvent, sceneCheckAllowed } from '../src/sceneGuard.js';
import { MODULE_NAME } from '../src/state.js';

const user = () => ({ is_user: true, is_system: false });
const bot = () => ({ is_user: false, is_system: false });
const tools = (...calls) => ({
    is_user: false, is_system: true,
    extra: { tool_invocations: calls.map(c => (typeof c === 'string' ? { name: c, result: 'ok' } : c)) },
});
const player = (kind) => ({ is_user: false, is_system: true, extra: { [MODULE_NAME]: { prompt: 'x', kind, source: 'player' } } });
const refusedScene = { name: 'mythic_scene', result: SCENE_NOT_ENDED };

test('refused mid-scene and at the start of a chat', () => {
    assert.equal(sceneCheckAllowed([]), false);
    assert.equal(sceneCheckAllowed([bot(), user(), tools('mythic_fate'), bot()]), false);
    assert.equal(sceneCheckAllowed([tools('mythic_chaos', 'mythic_scene'), bot(), user()]), false);
});

test('allowed once the scene is closed with a chaos adjustment', () => {
    assert.equal(sceneCheckAllowed([tools('mythic_scene'), bot(), user(), tools('mythic_chaos')]), true);
    assert.equal(sceneCheckAllowed([tools('mythic_scene'), bot(), player('chaos'), user()]), true);
});

test('player scene checks count; refused scene checks do not', () => {
    assert.equal(lastSceneEvent([tools('mythic_chaos'), player('scene')]), 'scene');
    assert.equal(lastSceneEvent([tools('mythic_chaos'), tools(refusedScene)]), 'chaos');
    assert.equal(lastSceneEvent([player('fate')]), null);
});

test('calls earlier in the running batch take precedence over chat', () => {
    assert.equal(sceneCheckAllowed([tools('mythic_scene')], 'chaos'), true);
    assert.equal(sceneCheckAllowed([tools('mythic_chaos')], 'scene'), false);
});
