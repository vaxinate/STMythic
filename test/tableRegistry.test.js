import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildDescription, normalizeRolls, parseTables, renderTableList, resolveTableName, unknownTableError,
} from '../src/tableRegistry.js';

const TEXT = `Name | when to use
Actions | what an NPC, group, or force does

# a comment
Descriptions|how something looks
Locations
actions | duplicate, ignored
 | no name, ignored`;

test('parseTables handles spacing, comments, bare names and duplicates', () => {
    assert.deepEqual(parseTables(TEXT), [
        { name: 'Name', when: 'when to use' },
        { name: 'Actions', when: 'what an NPC, group, or force does' },
        { name: 'Descriptions', when: 'how something looks' },
        { name: 'Locations', when: '' },
    ]);
    assert.deepEqual(parseTables(''), []);
    assert.deepEqual(parseTables(undefined), []);
});

test('renderTableList and buildDescription', () => {
    const tables = parseTables('Actions | what an NPC does\nLocations');
    assert.equal(renderTableList(tables), '- Actions: what an NPC does\n- Locations');
    assert.equal(buildDescription('Tables:\n{{tables}}\nEnd', tables), 'Tables:\n- Actions: what an NPC does\n- Locations\nEnd');
    assert.equal(buildDescription('No placeholder.', tables), 'No placeholder.\n- Actions: what an NPC does\n- Locations');
});

test('resolveTableName is case-insensitive and returns canonical names', () => {
    const tables = parseTables('Actions\nCharacter Descriptors');
    assert.equal(resolveTableName(tables, 'character descriptors '), 'Character Descriptors');
    assert.equal(resolveTableName(tables, 'Nope'), null);
    assert.equal(unknownTableError(tables, 'Nope'), 'Unknown table "Nope". Valid tables: Actions, Character Descriptors.');
});

test('normalizeRolls', () => {
    assert.equal(normalizeRolls(1), 1);
    assert.equal(normalizeRolls('2'), 2);
    assert.equal(normalizeRolls(undefined), 2);
    assert.equal(normalizeRolls(5), 2);
});
