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

// The pre-CR-001 default. A saved template that still matches it exactly is migrated on load.
const OLD_DEFAULT_DESCRIPTION_TEMPLATE = `Request a roll on a Mythic GME 2e table. The player will look up the result in the book.
Use when you need inspiration you shouldn't invent yourself. Interpret results in context, not literally.
Only these tables are available:
{{tables}}`;

export const DEFAULT_DESCRIPTION_TEMPLATE = `Roll on a Mythic GME 2e meaning table. The player looks up the result and returns the words.
REQUIRED when:
- a new NPC appears (their manner or look)
- an NPC or group decides what to do and the fiction doesn't dictate it
- the PC searches, enters a new place, or asks what's there
- a scene is Interrupted, or a random event needs a concrete shape
Do not invent these yourself. Interpret results in context, leaning toward complications.
Only these tables are available:
{{tables}}`;

export const DEFAULT_FATE_DESCRIPTION = `Ask the Mythic oracle a yes/no question about the world. Never use it for the PC's own actions; those are skill checks.
REQUIRED before narrating any of these as true:
- an NPC knows, has, or agrees to something the PC needs
- a route, door, guard, system, or opportunity is open, absent, or unaware
- timing or luck favors the PC
- the player asks about the world and the answer isn't already established
- an NPC or companion makes a choice that matters and isn't dictated by the fiction
Never answer these yourself. Pick odds from the fiction; when the answer helps the PC, default to unlikely.
The answer is binding.`;

export const DEFAULT_NUDGE_TEXT = `[Oracle check] You have narrated {{count}} responses without calling mythic_fate or mythic_table. In this response, resolve any uncertain fact, convenient detail, or unscripted NPC decision through mythic_fate or mythic_table before narrating it. If nothing in this response is uncertain, narrate normally. Never mention this reminder.`;

export const NUDGE_THRESHOLD_MIN = 1;
export const NUDGE_THRESHOLD_MAX = 10;

const DEFAULT_SETTINGS = Object.freeze({
    tables: DEFAULT_TABLES,
    descriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
    fateDescription: DEFAULT_FATE_DESCRIPTION,
    nudgeEnabled: true,
    nudgeThreshold: 3,
    nudgeText: DEFAULT_NUDGE_TEXT,
    showIdleCounter: true,
    panelCollapsed: false,
});

export function clampThreshold(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_SETTINGS.nudgeThreshold;
    return Math.min(NUDGE_THRESHOLD_MAX, Math.max(NUDGE_THRESHOLD_MIN, n));
}

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
    // CR-001: an unedited old table template moves to the new default; an edited one is kept.
    if (settings.descriptionTemplate === OLD_DEFAULT_DESCRIPTION_TEMPLATE) {
        settings.descriptionTemplate = DEFAULT_DESCRIPTION_TEMPLATE;
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
