// Per-chat Chaos Factor and shared extension settings, backed by SillyTavern.
import { CF_DEFAULT, clampCF } from './oracle.js';

export const MODULE_NAME = 'mythic_oracle';

// Check names against your copy of the 2e book; add or remove Elements tables as you like.
export const DEFAULT_TABLES = `Actions | what an NPC, group, or force does
Descriptions | what something or someone is like
Character Actions (General) | what an NPC does outside combat
Character Descriptors | what an NPC is like
Locations | what a place is like
Objects | what an item is or does`;

export const DEFAULT_DESCRIPTION_TEMPLATE = `Request a roll on a Mythic GME 2e table. The player will look up the result in the book.
Use when you need inspiration you shouldn't invent yourself. Interpret results in context, not literally.
Only these tables are available:
{{tables}}`;

const DEFAULT_SETTINGS = Object.freeze({
    tables: DEFAULT_TABLES,
    descriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
    panelCollapsed: false,
});

const cfListeners = new Set();

/** Called with the new CF whenever it changes through setCF. */
export function onCFChange(listener) {
    cfListeners.add(listener);
}

const ctx = () => SillyTavern.getContext();

export function getSettings() {
    const { extensionSettings } = ctx();
    extensionSettings[MODULE_NAME] ??= structuredClone(DEFAULT_SETTINGS);
    const settings = extensionSettings[MODULE_NAME];
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        settings[key] ??= value;
    }
    return settings;
}

export function saveSettings() {
    ctx().saveSettingsDebounced();
}

export function getCF() {
    const meta = ctx().chatMetadata?.[MODULE_NAME];
    return meta ? clampCF(meta.cf) : CF_DEFAULT;
}

/** Sets CF (clamped) and returns { from, to }. */
export function setCF(value) {
    const { chatMetadata, saveMetadataDebounced } = ctx();
    const from = getCF();
    const to = clampCF(value);
    chatMetadata[MODULE_NAME] = { ...chatMetadata[MODULE_NAME], cf: to };
    saveMetadataDebounced();
    for (const listener of cfListeners) listener(to);
    return { from, to };
}

export function adjustCF(delta) {
    return setCF(getCF() + Number(delta));
}
