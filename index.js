// Mythic Oracle — SillyTavern extension entry point.
import { MODULE_NAME } from './src/state.js';
import { clearInjection, interceptor } from './src/chat.js';
import { clearNudge, nudgeInterceptor } from './src/nudge.js';
import { registerCommands } from './src/commands.js';
import { onToolCallsPerformed, registerTools } from './src/tools.js';
import { renderSettings } from './src/settings.js';
import { refreshPanel, renderPanel } from './src/panel.js';

globalThis.mythicOracleInterceptor = async (chat, contextSize, abort, type) => {
    await interceptor(chat, contextSize, abort, type);
    nudgeInterceptor(type);
};

function clearInjections() {
    clearInjection();
    clearNudge();
}

jQuery(async () => {
    const { eventSource, event_types } = SillyTavern.getContext();
    registerCommands();
    // Registered regardless of the current API: ST only sends tools when tool calling is supported.
    registerTools();
    eventSource.on(event_types.TOOL_CALLS_PERFORMED, onToolCallsPerformed);
    for (const event of [event_types.GENERATION_ENDED, event_types.GENERATION_STOPPED, event_types.CHAT_CHANGED]) {
        eventSource.on(event, clearInjections);
    }
    renderPanel();
    // Anything that can change the Chaos Factor display or the oracle idle count.
    for (const event of [
        event_types.CHAT_CHANGED, event_types.MESSAGE_RECEIVED, event_types.MESSAGE_DELETED,
        event_types.MESSAGE_SWIPED, event_types.TOOL_CALLS_RENDERED, event_types.GENERATION_ENDED,
    ]) {
        eventSource.on(event, refreshPanel);
    }
    try {
        await renderSettings();
    } catch (error) {
        console.error('[Mythic Oracle] Failed to render settings', error);
    }
    console.log('[Mythic Oracle]', `loaded (${MODULE_NAME})`);
});
