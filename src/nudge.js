// Oracle nudge (CR-001): remind the narrator to consult the oracle after a run of replies without it.
import { clampThreshold, getSettings } from './state.js';

const INJECTION_KEY = 'mythic_oracle_nudge';
const CONSULT_TOOLS = ['mythic_fate', 'mythic_table'];
const SKIPPED_TYPES = ['quiet', 'impersonate'];

const ctx = () => SillyTavern.getContext();

/** A message holding a narrator mythic_fate or mythic_table tool call. */
function isConsult(message) {
    const invocations = message?.extra?.tool_invocations;
    return Array.isArray(invocations) && invocations.some(i => CONSULT_TOOLS.includes(i?.name));
}

/**
 * Narrator messages since the narrator last called mythic_fate or mythic_table, derived from
 * history so swipes, deletes, edits, reloads and branches need no bookkeeping. System messages
 * (player rolls, tool results, hidden messages) are skipped; on a swipe the reply being
 * regenerated doesn't count.
 */
export function narratorMessagesSinceConsult(chat, type) {
    const history = type === 'swipe' ? chat.slice(0, -1) : chat;
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        const message = history[i];
        if (isConsult(message)) break;
        if (!message.is_user && !message.is_system) count++;
    }
    return count;
}

/** The nudge text for this count, or '' when it shouldn't fire. */
export function nudgeFor(settings, count, type, substitute = (text) => text) {
    if (!settings.nudgeEnabled || SKIPPED_TYPES.includes(type)) return '';
    if (count < clampThreshold(settings.nudgeThreshold)) return '';
    return substitute(String(settings.nudgeText ?? '').replaceAll('{{count}}', String(count)));
}

function setInjection(text) {
    // extension_prompt_types.IN_CHAT = 1, depth 0 = after the last message, role SYSTEM = 0
    ctx().setExtensionPrompt(INJECTION_KEY, text, 1, 0, false, 0);
}

/** Runs from the generate interceptor before each (non-dry-run) generation. */
export function nudgeInterceptor(type) {
    const { chat, substituteParams } = ctx();
    const count = narratorMessagesSinceConsult(chat, type);
    const text = nudgeFor(getSettings(), count, type, substituteParams);
    if (text) console.log('[Mythic Oracle] Oracle nudge fired', { count, type });
    setInjection(text);
}

/** One-shot: cleared when a generation ends or stops, so it never leaks into a later turn. */
export function clearNudge() {
    setInjection('');
}

/** For the panel's idle counter. */
export function idleCount() {
    return narratorMessagesSinceConsult(ctx().chat ?? [], 'normal');
}
