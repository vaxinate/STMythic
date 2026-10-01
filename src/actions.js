// Oracle actions shared by player commands and model tools.
// Each returns { display, prompt, ... }: markdown for the chat, and text for the narrator.
import { ODDS_LABELS } from './fateChart.js';
import { SCENE, rollFate, rollScene } from './oracle.js';
import { adjustCF, getCF } from './state.js';
import { randomEventPopup } from './popups.js';
import { escapeMarkdown, eventDisplay, eventPrompt } from './randomEvent.js';

/** Rolls on the Fate Chart and, on a random event, asks the player for its details. */
export async function fateAction(odds, question, rng = Math.random) {
    const r = rollFate(odds, getCF(), rng);
    const event = r.randomEvent ? await randomEventPopup() : null;
    const q = question ? `“${question}” ` : '';
    const display = [`🎲 **Fate** ${escapeMarkdown(q)}(${ODDS_LABELS[odds]}, CF ${r.cf}): **${r.answer}** (d100=${r.roll})`];
    const prompt = [`Fate question ${q}(${ODDS_LABELS[odds]}): ${r.answer}.`];
    if (r.randomEvent) {
        display.push(eventDisplay(event));
        prompt.push(eventPrompt(event));
    }
    return { ...r, event, display: display.join('\n'), prompt: prompt.join(' ') };
}

const SCENE_INSTRUCTIONS = {
    [SCENE.EXPECTED]: 'The next scene plays out as set up.',
    [SCENE.ALTERED]: 'The next scene is meaningfully different from what was expected; change it in a significant way.',
    [SCENE.INTERRUPTED]: 'Discard the expected scene; something else happens instead. You may call mythic_table for inspiration.',
};

/** @param {string} [expected] the planned scene; sent to the narrator only, never displayed */
export function sceneAction(expected, rng = Math.random) {
    const r = rollScene(getCF(), rng);
    const planned = expected ? ` Expected scene: “${expected}”.` : '';
    return {
        ...r,
        display: `🎬 **Scene check:** ${r.result} (d10=${r.roll}, CF ${r.cf})`,
        prompt: `Scene check: ${r.result}.${planned} ${SCENE_INSTRUCTIONS[r.result]}`,
    };
}

export function chaosAction(delta, reason = '') {
    const { from, to } = adjustCF(delta);
    const why = reason ? ` — ${escapeMarkdown(reason)}` : '';
    const change = from === to ? `stays at ${to}` : `${from} → ${to}`;
    return {
        from, to,
        display: `🌀 **Chaos Factor** ${change}${why}`,
        prompt: `Chaos Factor ${change}.`,
    };
}
