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

// Earlier shipped defaults. A saved value that still matches one exactly is moved to the current
// default on load; anything the user edited is kept.
const PREVIOUS_DEFAULTS = {
    descriptionTemplate: [
        // v0.1
        `Request a roll on a Mythic GME 2e table. The player will look up the result in the book.
Use when you need inspiration you shouldn't invent yourself. Interpret results in context, not literally.
Only these tables are available:
{{tables}}`,
        // CR-001
        `Roll on a Mythic GME 2e meaning table. The player looks up the result and returns the words.
REQUIRED when:
- a new NPC appears (their manner or look)
- an NPC or group decides what to do and the fiction doesn't dictate it
- the PC searches, enters a new place, or asks what's there
- a scene is Interrupted, or a random event needs a concrete shape
Do not invent these yourself. Interpret results in context, leaning toward complications.
Only these tables are available:
{{tables}}`,
    ],
    fateDescription: [
        // CR-001
        `Ask the Mythic oracle a yes/no question about the world. Never use it for the PC's own actions; those are skill checks.
REQUIRED before narrating any of these as true:
- an NPC knows, has, or agrees to something the PC needs
- a route, door, guard, system, or opportunity is open, absent, or unaware
- timing or luck favors the PC
- the player asks about the world and the answer isn't already established
- an NPC or companion makes a choice that matters and isn't dictated by the fiction
Never answer these yourself. Pick odds from the fiction; when the answer helps the PC, default to unlikely.
The answer is binding.`,
    ],
    nudgeText: [
        // CR-001
        `[Oracle check] You have narrated {{count}} responses without calling mythic_fate or mythic_table. In this response, resolve any uncertain fact, convenient detail, or unscripted NPC decision through mythic_fate or mythic_table before narrating it. If nothing in this response is uncertain, narrate normally. Never mention this reminder.`,
    ],
};

export const DEFAULT_DESCRIPTION_TEMPLATE = `Roll on a Mythic GME 2e meaning table. The player looks up the result and returns the words.
Use it when one of these matters to the scene and the fiction doesn't already answer it:
- a new NPC appears (their manner or look)
- an NPC or group decides what to do and the fiction doesn't dictate it
- the PC searches, enters a new place, or asks what's there
- a scene is Interrupted, or a random event needs a concrete shape
Skip it for background characters, passing details, and places the PC only moves through.
Roll for the single most important unknown in a reply, not every one; answer the rest from the fiction.
Don't invent the cases above yourself. Interpret results in context, leaning toward complications.
Only these tables are available:
{{tables}}`;

export const DEFAULT_FATE_DESCRIPTION = `Ask the Mythic oracle a yes/no question about the world. Never use it for the PC's own actions; those are skill checks.
Use it before narrating any of these as true, when the answer would change what happens next:
- an NPC knows, has, or agrees to something the PC needs
- a route, door, guard, system, or opportunity is open, absent, or unaware
- timing or luck favors the PC
- the player asks about the world and the answer isn't already established
- an NPC or companion makes a choice that matters and isn't dictated by the fiction
Don't ask about minor details, things the fiction already settles, or anything that wouldn't change the outcome.
Ask about the single most important uncertainty in a reply, not every detail; answer the rest from the fiction.
Never answer the cases above yourself. Pick odds from the fiction; when the answer helps the PC, default to unlikely.
The answer is binding.`;

export const DEFAULT_NUDGE_TEXT = `[Oracle check] You have narrated {{count}} responses without calling mythic_fate or mythic_table. If this response depends on an uncertain fact, a convenient detail, or an unscripted NPC decision that changes what happens next, resolve the most important one with a single mythic_fate or mythic_table call before narrating it. If nothing like that comes up, narrate normally. Never mention this reminder.`;

export const NUDGE_THRESHOLD_MIN = 1;
export const NUDGE_THRESHOLD_MAX = 10;
export const MAX_CONSULTS_MIN = 1;
export const MAX_CONSULTS_MAX = 5;

const DEFAULT_SETTINGS = Object.freeze({
    tables: DEFAULT_TABLES,
    descriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
    fateDescription: DEFAULT_FATE_DESCRIPTION,
    nudgeEnabled: true,
    nudgeThreshold: 3,
    nudgeText: DEFAULT_NUDGE_TEXT,
    showIdleCounter: true,
    maxConsultsPerReply: 1,
    panelCollapsed: false,
});

const CURRENT_DEFAULTS = {
    descriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
    fateDescription: DEFAULT_FATE_DESCRIPTION,
    nudgeText: DEFAULT_NUDGE_TEXT,
};

function clampInt(value, min, max, fallback) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

export function clampMaxConsults(value) {
    return clampInt(value, MAX_CONSULTS_MIN, MAX_CONSULTS_MAX, DEFAULT_SETTINGS.maxConsultsPerReply);
}

export function clampThreshold(value) {
    return clampInt(value, NUDGE_THRESHOLD_MIN, NUDGE_THRESHOLD_MAX, DEFAULT_SETTINGS.nudgeThreshold);
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
    for (const [key, previous] of Object.entries(PREVIOUS_DEFAULTS)) {
        if (previous.includes(settings[key])) settings[key] = CURRENT_DEFAULTS[key];
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
