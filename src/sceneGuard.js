// Scene loop guard: a scene check is only allowed once the scene has been closed with a Chaos adjustment.
import { MODULE_NAME } from './state.js';

export const SCENE_NOT_ENDED = 'Scene check refused: the current scene has not been closed. '
    + 'mythic_scene is only for moving to a new scene, after the scene ends and you call mythic_chaos. '
    + 'If the scene is still going, do not call mythic_chaos or mythic_scene; continue narrating it, '
    + 'and use mythic_fate for yes/no questions.';

/** 'scene' | 'chaos' events in one message, oldest first. A refused scene check isn't an event. */
function sceneEvents(message) {
    const invocations = message?.extra?.tool_invocations;
    if (Array.isArray(invocations)) {
        return invocations
            .filter(i => i?.name === 'mythic_chaos' || (i?.name === 'mythic_scene' && !String(i.result ?? '').startsWith(SCENE_NOT_ENDED)))
            .map(i => i.name.replace('mythic_', ''));
    }
    // Player /scene and /chaos results.
    const kind = message?.extra?.[MODULE_NAME]?.kind;
    return kind === 'scene' || kind === 'chaos' ? [kind] : [];
}

/** The most recent scene check or Chaos adjustment in chat, or null if there's neither. */
export function lastSceneEvent(chat) {
    for (let i = chat.length - 1; i >= 0; i--) {
        const events = sceneEvents(chat[i]);
        if (events.length) return events[events.length - 1];
    }
    return null;
}

/** A scene check may run only when a Chaos adjustment came after the last scene check. */
export function sceneCheckAllowed(chat, inFlight = null) {
    return (inFlight ?? lastSceneEvent(chat)) === 'chaos';
}
