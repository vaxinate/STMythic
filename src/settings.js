// Settings drawer: oracle nudge, tool descriptions, and the table registry.
import {
    DEFAULT_DESCRIPTION_TEMPLATE, DEFAULT_FATE_DESCRIPTION, DEFAULT_NUDGE_TEXT, DEFAULT_TABLES,
    clampMaxConsults, clampThreshold, getSettings, saveSettings,
} from './state.js';
import { registerFateTool, registerTableTool } from './tools.js';
import { refreshPanel } from './panel.js';

// e.g. "third-party/STMythic", whatever folder ST installed us into.
export const EXTENSION_PATH = new URL('..', import.meta.url).pathname
    .replace(/^.*\/scripts\/extensions\//, '')
    .replace(/\/$/, '');

const DEFAULTS = {
    nudgeText: DEFAULT_NUDGE_TEXT,
    fateDescription: DEFAULT_FATE_DESCRIPTION,
    tables: DEFAULT_TABLES,
    descriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
};

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

const applyTableTool = debounce(registerTableTool, 500);
const applyFateTool = debounce(registerFateTool, 500);

/** Renders the drawer into ST's extensions panel and returns its root element. */
export async function renderSettings() {
    const { renderExtensionTemplateAsync } = SillyTavern.getContext();
    const html = await renderExtensionTemplateAsync(EXTENSION_PATH, 'settings', {}, false);
    const root = $(html);
    $('#extensions_settings2').append(root);

    const settings = getSettings();

    /** Binds a textarea to a setting; `apply` runs after each change (debounced where it re-registers). */
    const bindText = (selector, key, apply = () => {}) => {
        const field = root.find(selector);
        field.val(settings[key]).on('input', () => {
            settings[key] = String(field.val());
            saveSettings();
            apply();
        });
        root.find(`.mythic-reset[data-reset="${key}"]`).on('click', () => field.val(DEFAULTS[key]).trigger('input'));
    };
    bindText('#mythic_nudge_text', 'nudgeText');
    bindText('#mythic_fate_description', 'fateDescription', applyFateTool);
    bindText('#mythic_tables', 'tables', applyTableTool);
    bindText('#mythic_description_template', 'descriptionTemplate', applyTableTool);

    const bindCheckbox = (selector, key) => {
        const box = root.find(selector);
        box.prop('checked', Boolean(settings[key])).on('change', () => {
            settings[key] = box.prop('checked');
            saveSettings();
            refreshPanel();
        });
    };
    bindCheckbox('#mythic_nudge_enabled', 'nudgeEnabled');
    bindCheckbox('#mythic_show_idle', 'showIdleCounter');

    const bindNumber = (selector, key, clamp) => {
        const field = root.find(selector);
        field.val(clamp(settings[key])).on('change', () => {
            settings[key] = clamp(field.val());
            field.val(settings[key]);
            saveSettings();
            refreshPanel();
        });
    };
    bindNumber('#mythic_nudge_threshold', 'nudgeThreshold', clampThreshold);
    bindNumber('#mythic_max_consults', 'maxConsultsPerReply', clampMaxConsults);

    return root;
}
