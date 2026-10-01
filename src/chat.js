// Posting oracle results to chat and injecting them into the narrator's prompt.
import { MODULE_NAME } from './state.js';

const INJECTION_KEY = 'mythic_oracle_results';
const MESSAGE_NAME = 'Mythic';

const ctx = () => SillyTavern.getContext();

/**
 * Posts a result as a system message. System messages are excluded from the prompt,
 * so the narrator learns about it through the injection built in `interceptor`.
 * @param {string} display Markdown shown to the player.
 * @param {string} prompt Text the narrator receives on its next reply.
 */
export async function postResult(display, prompt) {
    const { chat, addOneMessage, saveChat } = ctx();
    const message = {
        name: MESSAGE_NAME,
        is_user: false,
        is_system: true,
        send_date: new Date().toISOString(),
        mes: display,
        extra: {
            isSmallSys: true,
            [MODULE_NAME]: { prompt },
        },
    };
    chat.push(message);
    addOneMessage(message);
    await saveChat();
}

/**
 * Oracle results the narrator hasn't replied to yet: those posted after the last
 * non-system character message. On a swipe the reply being replaced doesn't count.
 */
export function pendingResults(chat, type) {
    const history = type === 'swipe' ? chat.slice(0, -1) : chat;
    const results = [];
    for (let i = history.length - 1; i >= 0; i--) {
        const message = history[i];
        if (!message.is_user && !message.is_system) break;
        const prompt = message.extra?.[MODULE_NAME]?.prompt;
        if (prompt) results.unshift(prompt);
    }
    return results;
}

export function buildInjection(results) {
    if (!results.length) return '';
    return [
        '[Mythic oracle — these results were rolled by the player and are binding. Narrate consistently with them; do not reroll or contradict them.]',
        ...results,
    ].join('\n');
}

function setInjection(text) {
    // extension_prompt_types.IN_CHAT = 1, depth 0 = after the last message, role SYSTEM = 0
    ctx().setExtensionPrompt(INJECTION_KEY, text, 1, 0, false, 0);
}

/** Registered as the manifest's generate_interceptor. ST skips interceptors on dry runs. */
export async function interceptor(_coreChat, _contextSize, _abort, type) {
    setInjection(type === 'quiet' ? '' : buildInjection(pendingResults(ctx().chat, type)));
}

/** Clear after each generation so dry runs (prompt inspector, token counts) don't show stale results. */
export function clearInjection() {
    setInjection('');
}
