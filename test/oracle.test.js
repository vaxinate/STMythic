import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FATE_CHART, ODDS } from '../src/fateChart.js';
import {
    ANSWERS, SCENE, clampCF, getThresholds, isRandomEvent, resolveFate,
    resolveScene, rollDie, rollFate, rollScene,
} from '../src/oracle.js';

// rng that makes rollDie(sides) return exactly `value`
const fixed = (value, sides) => () => (value - 1) / sides;

test('chart has 9 odds x 9 CF cells with sane thresholds', () => {
    assert.deepEqual(Object.keys(FATE_CHART), ODDS);
    for (const odds of ODDS) {
        assert.equal(FATE_CHART[odds].length, 9);
        for (const [exYes, yes, exNo] of FATE_CHART[odds]) {
            assert.ok(exYes >= 0 && exYes <= yes, `${odds}: exYes ${exYes} <= yes ${yes}`);
            assert.ok(yes < exNo && exNo <= 101, `${odds}: yes ${yes} < exNo ${exNo}`);
        }
    }
});

test('chart is monotonic in odds and CF', () => {
    for (let o = 0; o < ODDS.length; o++) {
        for (let cf = 1; cf <= 9; cf++) {
            const { yes } = getThresholds(ODDS[o], cf);
            if (cf > 1) assert.ok(yes >= getThresholds(ODDS[o], cf - 1).yes);
            if (o > 0) assert.ok(yes >= getThresholds(ODDS[o - 1], cf).yes);
        }
    }
});

test('resolveFate boundaries at every cell', () => {
    for (const odds of ODDS) {
        for (let cf = 1; cf <= 9; cf++) {
            const { exYes, yes, exNo } = getThresholds(odds, cf);
            if (exYes >= 1) assert.equal(resolveFate(exYes, odds, cf), ANSWERS.EX_YES);
            if (exYes + 1 <= yes) assert.equal(resolveFate(exYes + 1, odds, cf), ANSWERS.YES);
            assert.equal(resolveFate(yes, odds, cf), exYes >= yes ? ANSWERS.EX_YES : ANSWERS.YES);
            if (yes + 1 < exNo) assert.equal(resolveFate(yes + 1, odds, cf), ANSWERS.NO);
            if (exNo <= 100) {
                assert.equal(resolveFate(exNo, odds, cf), ANSWERS.EX_NO);
                assert.equal(resolveFate(exNo - 1, odds, cf), exNo - 1 <= yes ? ANSWERS.YES : ANSWERS.NO);
            } else {
                assert.notEqual(resolveFate(100, odds, cf), ANSWERS.EX_NO);
            }
        }
    }
});

test('50/50 at CF 5', () => {
    assert.deepEqual(getThresholds('50_50', 5), { exYes: 10, yes: 50, exNo: 91 });
    assert.equal(resolveFate(1, '50_50', 5), ANSWERS.EX_YES);
    assert.equal(resolveFate(50, '50_50', 5), ANSWERS.YES);
    assert.equal(resolveFate(51, '50_50', 5), ANSWERS.NO);
    assert.equal(resolveFate(91, '50_50', 5), ANSWERS.EX_NO);
});

test('unknown odds throws', () => {
    assert.throws(() => getThresholds('maybe', 5), /Unknown odds/);
});

test('random event on doubles <= CF only', () => {
    for (let roll = 1; roll <= 100; roll++) {
        for (let cf = 1; cf <= 9; cf++) {
            const expected = roll % 11 === 0 && roll <= 99 && roll / 11 <= cf;
            assert.equal(isRandomEvent(roll, cf), expected, `roll ${roll} cf ${cf}`);
        }
    }
    assert.equal(isRandomEvent(55, 5), true);
    assert.equal(isRandomEvent(66, 5), false);
    assert.equal(isRandomEvent(100, 9), false);
});

test('scene check outcomes', () => {
    assert.equal(resolveScene(1, 5), SCENE.ALTERED);
    assert.equal(resolveScene(2, 5), SCENE.INTERRUPTED);
    assert.equal(resolveScene(5, 5), SCENE.ALTERED);
    assert.equal(resolveScene(6, 5), SCENE.EXPECTED);
    assert.equal(resolveScene(10, 9), SCENE.EXPECTED);
    assert.equal(resolveScene(9, 9), SCENE.ALTERED);
    assert.equal(resolveScene(2, 1), SCENE.EXPECTED);
});

test('clampCF', () => {
    assert.equal(clampCF(0), 1);
    assert.equal(clampCF(10), 9);
    assert.equal(clampCF('6'), 6);
    assert.equal(clampCF(undefined), 5);
    assert.equal(clampCF(NaN), 5);
});

test('rollDie covers full range', () => {
    assert.equal(rollDie(100, () => 0), 1);
    assert.equal(rollDie(100, () => 0.99999), 100);
    assert.equal(rollDie(10, fixed(7, 10)), 7);
});

test('rollFate and rollScene with injected rng', () => {
    assert.deepEqual(rollFate('50_50', 5, fixed(33, 100)),
        { roll: 33, odds: '50_50', cf: 5, answer: ANSWERS.YES, randomEvent: true });
    assert.deepEqual(rollScene(4, fixed(4, 10)), { roll: 4, cf: 4, result: SCENE.INTERRUPTED });
});
