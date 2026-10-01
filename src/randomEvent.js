// Formatting a random event for chat display and for the narrator. Shared by /fate and mythic_fate.

export const SKIPPED_EVENT_PROMPT = 'Random event triggered; player skipped details. Improvise one.';

// HTML entities rather than backslashes: ST's formatter shows `\<` literally and ignores `\_`.
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '*': '&#42;', '_': '&#95;', '`': '&#96;', '~': '&#126;', '[': '&#91;', ']': '&#93;', '|': '&#124;', '#': '&#35;', '\\': '&#92;' };
export const escapeMarkdown = (text) => text.replace(/[&<>*_`~[\]|#\\]/g, ch => ENTITIES[ch]);

/** @param {{focus: string, word1: string, word2: string, notes: string}|null} event */
export function eventPrompt(event) {
    if (!event) return SKIPPED_EVENT_PROMPT;
    const parts = [];
    if (event.focus) parts.push(`Event Focus: ${event.focus}`);
    const words = [event.word1, event.word2].filter(Boolean).join(' / ');
    if (words) parts.push(`Meaning: ${words}`);
    if (event.notes) parts.push(`Notes: ${event.notes}`);
    return `Random event — ${parts.join('; ')}. Introduce it now, interpreting the meaning words in context.`;
}

export function eventDisplay(event) {
    if (!event) return '⚡ **Random event** (details skipped)';
    const words = [event.word1, event.word2].filter(Boolean).join(' / ');
    const parts = [event.focus, words, event.notes].filter(Boolean).map(escapeMarkdown);
    return `⚡ **Random event:** ${parts.join(' — ')}`;
}
