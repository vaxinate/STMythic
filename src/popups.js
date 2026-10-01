// Player-facing popups. Each resolves to a value, or null when the player cancels.
import { ODDS, ODDS_LABELS } from './fateChart.js';

const ctx = () => SillyTavern.getContext();

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * Shows the question with one button per odds level. Enter picks the suggested odds.
 * @returns {Promise<string|null>} an ODDS key, or null if cancelled
 */
export async function confirmOdds(question, suggested = '50_50') {
    const { Popup, POPUP_TYPE, POPUP_RESULT } = ctx();
    const CUSTOM_BASE = POPUP_RESULT.CUSTOM1;
    const content = el('div', 'mythic-popup');
    content.append(el('h3', null, 'Fate question'));
    if (question) content.append(el('p', 'mythic-question', question));
    content.append(el('p', 'mythic-hint', ODDS.includes(suggested)
        ? `Suggested odds: ${ODDS_LABELS[suggested]}. Pick the odds to roll.`
        : 'Pick the odds to roll.'));

    const customButtons = ODDS.map((odds, i) => ({
        text: ODDS_LABELS[odds],
        result: CUSTOM_BASE + i,
        classes: ['mythic-odds-button', ...(odds === suggested ? ['mythic-suggested'] : [])],
        appendAtEnd: true,
    }));
    const popup = new Popup(content, POPUP_TYPE.TEXT, '', {
        okButton: false,
        cancelButton: 'Cancel',
        customButtons,
        defaultResult: ODDS.includes(suggested) ? CUSTOM_BASE + ODDS.indexOf(suggested) : POPUP_RESULT.CANCELLED,
        wider: true,
    });
    const result = await popup.show();
    const index = typeof result === 'number' ? result - CUSTOM_BASE : -1;
    return ODDS[index] ?? null;
}

/**
 * Asks the player to generate a random event in Mythic and enter it.
 * @returns {Promise<{focus: string, word1: string, word2: string, notes: string}|null>}
 *   null when skipped, cancelled, or submitted empty
 */
export async function randomEventPopup() {
    const { Popup, POPUP_TYPE, POPUP_RESULT } = ctx();
    const content = el('div', 'mythic-popup');
    content.append(el('h3', null, 'Random event triggered'));
    content.append(el('p', 'mythic-hint', 'Generate it in Mythic, then enter it here.'));

    const popup = new Popup(content, POPUP_TYPE.TEXT, '', {
        okButton: 'Add event',
        cancelButton: 'Skip',
        customInputs: [
            { id: 'mythic_event_focus', label: 'Event Focus', type: 'text', autoFocus: true },
            { id: 'mythic_event_word1', label: 'Meaning word 1', type: 'text' },
            { id: 'mythic_event_word2', label: 'Meaning word 2', type: 'text' },
            { id: 'mythic_event_notes', label: 'Notes (optional)', type: 'textarea', rows: 2 },
        ],
    });
    const result = await popup.show();
    if (result !== POPUP_RESULT.AFFIRMATIVE || !popup.inputResults) return null;
    const get = (id) => String(popup.inputResults.get(id) ?? '').trim();
    const event = {
        focus: get('mythic_event_focus'),
        word1: get('mythic_event_word1'),
        word2: get('mythic_event_word2'),
        notes: get('mythic_event_notes'),
    };
    return Object.values(event).some(Boolean) ? event : null;
}

/**
 * One input per roll for the player to type the table result from the book.
 * @param {string} table
 * @param {number[]} rolls
 * @returns {Promise<string[]|null>}
 */
export async function tableEntryPopup(table, rolls) {
    const { Popup, POPUP_TYPE, POPUP_RESULT } = ctx();
    const content = el('div', 'mythic-popup');
    content.append(el('h3', null, `Meaning table: ${table}`));
    content.append(el('p', 'mythic-hint', 'Look up each roll in the book or companion app.'));

    const ids = rolls.map((_, i) => `mythic_table_roll_${i}`);
    const popup = new Popup(content, POPUP_TYPE.TEXT, '', {
        okButton: 'Send',
        cancelButton: 'Cancel',
        customInputs: rolls.map((roll, i) => ({
            id: ids[i], label: `Roll ${i + 1}: ${roll}`, type: 'text', autoFocus: i === 0,
        })),
    });
    const result = await popup.show();
    if (result !== POPUP_RESULT.AFFIRMATIVE || !popup.inputResults) return null;
    return ids.map(id => String(popup.inputResults.get(id) ?? '').trim());
}
