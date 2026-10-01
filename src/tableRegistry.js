// Parsing the table registry setting into the mythic_table tool definition. Pure; no ST imports.

export const TABLES_PLACEHOLDER = '{{tables}}';

/**
 * Parses "Name | when to use" lines. Blank lines and lines starting with # are skipped.
 * Later duplicates (case-insensitive) are ignored.
 * @returns {{name: string, when: string}[]}
 */
export function parseTables(text) {
    const tables = [];
    const seen = new Set();
    for (const line of String(text ?? '').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const bar = trimmed.indexOf('|');
        const name = (bar === -1 ? trimmed : trimmed.slice(0, bar)).trim();
        const when = bar === -1 ? '' : trimmed.slice(bar + 1).trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        tables.push({ name, when });
    }
    return tables;
}

export function renderTableList(tables) {
    return tables.map(t => (t.when ? `- ${t.name}: ${t.when}` : `- ${t.name}`)).join('\n');
}

/** Fills {{tables}}; if the template has no placeholder, the list is appended so the tool stays usable. */
export function buildDescription(template, tables) {
    const list = renderTableList(tables);
    const text = String(template ?? '');
    return text.includes(TABLES_PLACEHOLDER)
        ? text.replaceAll(TABLES_PLACEHOLDER, list)
        : `${text.trim()}\n${list}`.trim();
}

/** Case-insensitive lookup; returns the canonical name or null. */
export function resolveTableName(tables, requested) {
    const wanted = String(requested ?? '').trim().toLowerCase();
    return tables.find(t => t.name.toLowerCase() === wanted)?.name ?? null;
}

export const UNKNOWN_TABLE_PREFIX = 'Unknown table';

export function unknownTableError(tables, requested) {
    return `${UNKNOWN_TABLE_PREFIX} "${requested}". Valid tables: ${tables.map(t => t.name).join(', ')}.`;
}

/** 1 or 2 rolls; anything else falls back to the default of 2. */
export function normalizeRolls(rolls) {
    const n = Number(rolls);
    return n === 1 || n === 2 ? n : 2;
}
