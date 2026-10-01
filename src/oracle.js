// Pure oracle logic. No SillyTavern imports, so it can be tested under node.
import { FATE_CHART, ODDS } from './fateChart.js';

export const CF_MIN = 1;
export const CF_MAX = 9;
export const CF_DEFAULT = 5;

export const ANSWERS = {
    EX_YES: 'Exceptional Yes',
    YES: 'Yes',
    NO: 'No',
    EX_NO: 'Exceptional No',
};

export const SCENE = {
    EXPECTED: 'Expected',
    ALTERED: 'Altered',
    INTERRUPTED: 'Interrupted',
};

/** rng returns a float in [0, 1), like Math.random. */
export function rollDie(sides, rng = Math.random) {
    return Math.floor(rng() * sides) + 1;
}

export const rollD100 = (rng) => rollDie(100, rng);
export const rollD10 = (rng) => rollDie(10, rng);

export function clampCF(cf) {
    const n = Math.round(Number(cf));
    if (!Number.isFinite(n)) return CF_DEFAULT;
    return Math.min(CF_MAX, Math.max(CF_MIN, n));
}

export function isValidOdds(odds) {
    return ODDS.includes(odds);
}

export function getThresholds(odds, cf, chart = FATE_CHART) {
    if (!isValidOdds(odds)) throw new Error(`Unknown odds "${odds}". Valid: ${ODDS.join(', ')}`);
    const [exYes, yes, exNo] = chart[odds][clampCF(cf) - 1];
    return { exYes, yes, exNo };
}

export function resolveFate(roll, odds, cf, chart = FATE_CHART) {
    const { exYes, yes, exNo } = getThresholds(odds, cf, chart);
    if (roll <= exYes) return ANSWERS.EX_YES;
    if (roll <= yes) return ANSWERS.YES;
    if (roll >= exNo) return ANSWERS.EX_NO;
    return ANSWERS.NO;
}

/** Doubles (11, 22 … 99) whose digit is ≤ CF trigger a random event. */
export function isRandomEvent(roll, cf) {
    if (roll < 11 || roll > 99 || roll % 11 !== 0) return false;
    return roll / 11 <= clampCF(cf);
}

export function rollFate(odds, cf, rng = Math.random, chart = FATE_CHART) {
    const roll = rollD100(rng);
    return {
        roll,
        odds,
        cf: clampCF(cf),
        answer: resolveFate(roll, odds, cf, chart),
        randomEvent: isRandomEvent(roll, cf),
    };
}

export function resolveScene(roll, cf) {
    if (roll > clampCF(cf)) return SCENE.EXPECTED;
    return roll % 2 === 1 ? SCENE.ALTERED : SCENE.INTERRUPTED;
}

export function rollScene(cf, rng = Math.random) {
    const roll = rollD10(rng);
    return { roll, cf: clampCF(cf), result: resolveScene(roll, cf) };
}
