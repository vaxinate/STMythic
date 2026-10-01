// Mythic Oracle — SillyTavern extension entry point.
import { MODULE_NAME } from './src/state.js';
import { clearInjection, interceptor } from './src/chat.js';
import { registerCommands } from './src/commands.js';
import { onToolCallsPerformed, registerTools } from './src/tools.js';
import { renderSettings } from './src/settings.js';
import { refreshPanel, renderPanel } from './src/panel.js';

globalThis.mythicOracleInterceptor = interceptor;

jQuery(async () => {
    const { eventSource, event_types } = SillyTavern.getContext();
    registerCommands();
    // Registered regardless of the current API: ST only sends tools when tool calling is supported.
    registerTools();
    eventSource.on(event_types.TOOL_CALLS_PERFORMED, onToolCallsPerformed);
    eventSource.on(event_types.GENERATION_ENDED, clearInjection);
    eventSource.on(event_types.CHAT_CHANGED, clearInjection);
    renderPanel();
    eventSource.on(event_types.CHAT_CHANGED, refreshPanel);
    try {
        await renderSettings();
    } catch (error) {
        console.error('[Mythic Oracle] Failed to render settings', error);
    }
    console.log('[Mythic Oracle]', `loaded (${MODULE_NAME})`);
});
