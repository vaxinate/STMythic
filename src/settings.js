// Settings drawer: table registry and tool description template.
import { DEFAULT_DESCRIPTION_TEMPLATE, DEFAULT_TABLES, getSettings, saveSettings } from './state.js';
import { registerTableTool } from './tools.js';

// e.g. "third-party/STMythic", whatever folder ST installed us into.
export const EXTENSION_PATH = new URL('..', import.meta.url).pathname
    .replace(/^.*\/scripts\/extensions\//, '')
    .replace(/\/$/, '');

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

const applyRegistry = debounce(() => {
    saveSettings();
    registerTableTool();
}, 500);

/** Renders the drawer into ST's extensions panel and returns its root element. */
export async function renderSettings() {
    const { renderExtensionTemplateAsync } = SillyTavern.getContext();
    const html = await renderExtensionTemplateAsync(EXTENSION_PATH, 'settings', {}, false);
    const root = $(html);
    $('#extensions_settings2').append(root);

    const settings = getSettings();
    const tables = root.find('#mythic_tables');
    const template = root.find('#mythic_description_template');
    tables.val(settings.tables);
    template.val(settings.descriptionTemplate);

    tables.on('input', () => { settings.tables = String(tables.val()); applyRegistry(); });
    template.on('input', () => { settings.descriptionTemplate = String(template.val()); applyRegistry(); });
    root.find('#mythic_reset_tables').on('click', () => {
        tables.val(DEFAULT_TABLES).trigger('input');
        template.val(DEFAULT_DESCRIPTION_TEMPLATE).trigger('input');
    });
    return root;
}
