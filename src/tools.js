// Model tools (Chat Completion function calling) and spoiler-free display of their calls.
import { ODDS } from './fateChart.js';
import { chaosAction, fateAction, sceneAction } from './actions.js';
import { rollD100 } from './oracle.js';
import { confirmOdds, tableEntryPopup } from './popups.js';
import { escapeMarkdown } from './randomEvent.js';
import { getSettings } from './state.js';
import {
    buildDescription, normalizeRolls, parseTables, resolveTableName, unknownTableError,
} from './tableRegistry.js';

export const DECLINED = 'Player declined; improvise.';

const ctx = () => SillyTavern.getContext();

/**
 * Chat display for each tool result, keyed by the exact result string the action returned.
 * ST hands that string back in TOOL_CALLS_PERFORMED, so the display can be matched without
 * relying on call order. Each key holds a queue, since calls in one batch can return the same string.
 * @type {Map<string, string[]>}
 */
const displays = new Map();

function respond(prompt, display) {
    displays.set(prompt, [...(displays.get(prompt) ?? []), display]);
    return prompt;
}

function takeDisplay(result) {
    const queue = displays.get(result);
    const display = queue?.shift();
    if (!queue?.length) displays.delete(result);
    return display;
}

const TOOLS = [
    {
        name: 'mythic_fate',
        displayName: 'Mythic: Fate',
        description: 'Ask the Mythic GME Fate Chart a yes/no question when the answer is uncertain and matters to the story. '
            + 'Suggest odds; the player confirms them and the extension rolls. The answer is binding: narrate consistently with it. '
            + 'An Exceptional answer is a stronger yes or no. The result may include a random event you must introduce.',
        parameters: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'A yes/no question about the fiction.' },
                odds: { type: 'string', enum: ODDS, description: 'How likely a yes is, given the fiction.' },
            },
            required: ['question', 'odds'],
        },
        formatMessage: () => 'Consulting the oracle…',
        action: async ({ question, odds }) => {
            const confirmed = await confirmOdds(question, odds);
            if (!confirmed) return respond(DECLINED, '🎲 **Fate:** player declined');
            const r = await fateAction(confirmed, question);
            return respond(`${r.prompt} (d100=${r.roll}, CF ${r.cf})`, r.display);
        },
    },
    {
        name: 'mythic_scene',
        displayName: 'Mythic: Scene check',
        description: 'At the start of each new scene (not the first scene of the session), commit to the scene you plan, then roll the Mythic scene check. '
            + 'Returns Expected (play it as planned), Altered (change it meaningfully), or Interrupted (discard it; something else happens). '
            + 'The player never sees your planned scene, so describe it honestly.',
        parameters: {
            type: 'object',
            properties: {
                expected: { type: 'string', description: 'One or two sentences describing the planned next scene.' },
            },
            required: ['expected'],
        },
        formatMessage: () => 'Checking the scene…',
        action: ({ expected }) => {
            const r = sceneAction(String(expected ?? ''));
            // Only the outcome is shown; the planned scene stays in the tool result for the narrator.
            return respond(r.prompt, `🎬 **Scene check:** ${r.result}`);
        },
    },
    {
        name: 'mythic_chaos',
        displayName: 'Mythic: Chaos Factor',
        description: 'Call exactly once when a scene ends, before the next scene check. '
            + 'Use -1 if the player character was in control of the scene, +1 if not, 0 to leave it unchanged. The Chaos Factor stays within 1–9.',
        parameters: {
            type: 'object',
            properties: {
                // No integer enum: Gemini only accepts enum on strings. The action clamps with Math.sign.
                change: { type: 'integer', description: 'Exactly -1, 0, or 1.' },
                reason: { type: 'string', description: 'One line on whether the PC was in control of the scene.' },
            },
            required: ['change', 'reason'],
        },
        formatMessage: () => 'Adjusting the chaos…',
        action: ({ change, reason }) => {
            const delta = Math.sign(Number(change) || 0);
            const r = chaosAction(delta, String(reason ?? '').trim());
            return respond(r.prompt, r.display);
        },
    },
];

const TABLE_TOOL = 'mythic_table';

/** Builds mythic_table from the registry settings, or null when no tables are configured. */
function tableTool() {
    const settings = getSettings();
    const tables = parseTables(settings.tables);
    if (!tables.length) return null;
    return {
        name: TABLE_TOOL,
        displayName: 'Mythic: Meaning table',
        description: buildDescription(settings.descriptionTemplate, tables),
        parameters: {
            type: 'object',
            properties: {
                table: { type: 'string', enum: tables.map(t => t.name), description: 'Which table to roll on.' },
                rolls: { type: 'integer', description: 'Number of d100 rolls, 1 or 2. Defaults to 2.' },
            },
            required: ['table'],
        },
        formatMessage: () => 'Rolling on a meaning table…',
        action: async ({ table, rolls }) => {
            // Re-read the registry so a call made just after an edit validates against the current list.
            const current = parseTables(getSettings().tables);
            const name = resolveTableName(current, table);
            if (!name) return respond(unknownTableError(current, table), `📜 **Meaning table:** unknown table “${escapeMarkdown(String(table ?? ''))}”`);
            const values = Array.from({ length: normalizeRolls(rolls) }, () => rollD100());
            const entries = await tableEntryPopup(name, values);
            if (!entries) return respond(DECLINED, `📜 **${escapeMarkdown(name)}:** player declined`);
            const pairs = values.map((roll, i) => `roll ${roll} → “${entries[i] || '(no entry)'}”`);
            return respond(
                `Meaning table ${name}: ${pairs.join(', ')}. Interpret these in context, not literally.`,
                `📜 **${escapeMarkdown(name)}:** ${entries.map(e => escapeMarkdown(e || '—')).join(' / ')}`,
            );
        },
    };
}

export const TOOL_NAMES = [...TOOLS.map(t => t.name), TABLE_TOOL];

export function registerTools() {
    const { registerFunctionTool } = ctx();
    for (const tool of TOOLS) registerFunctionTool(tool);
    registerTableTool();
}

/** (Re)registers mythic_table from the current settings. Call after editing the registry. */
export function registerTableTool() {
    const { registerFunctionTool, unregisterFunctionTool } = ctx();
    unregisterFunctionTool(TABLE_TOOL);
    const tool = tableTool();
    if (tool) registerFunctionTool(tool);
}

/**
 * ST skips markdown for messages named "SillyTavern System" (which tool-call messages are),
 * so convert our display markdown — only **bold** and line breaks; player text is already
 * entity-escaped — to HTML. One <div> per line: ST's CSS hides <br> in these messages.
 */
export function displayToHtml(markdown) {
    return markdown.split('\n')
        .map(line => `<div>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</div>`)
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Rebuilds ST's collapsible JSON block for any non-Mythic tools called alongside ours. */
function otherToolsBlock(invocations) {
    if (!invocations.length) return '';
    const names = invocations.map(i => i.displayName || i.name).join(', ');
    const json = JSON.stringify(invocations.map(({ name, parameters, result }) => ({ name, parameters, result })), null, 2);
    return `<details><summary>Tool calls: ${escapeHtml(names)}</summary><pre><code class="language-json">${escapeHtml(json)}</code></pre></details>`;
}

/**
 * The chat shows the tool-call message's `mes`, while the prompt is built from
 * `extra.tool_invocations`. This runs after the message is pushed and before it is
 * rendered, so replacing `mes` hides arguments and results without affecting the model.
 */
export function onToolCallsPerformed(invocations) {
    if (!invocations.some(i => TOOL_NAMES.includes(i.name))) return;
    const { chat } = ctx();
    const message = chat[chat.length - 1];
    if (message?.extra?.tool_invocations !== invocations) return;

    const lines = [];
    const others = [];
    for (const invocation of invocations) {
        if (!TOOL_NAMES.includes(invocation.name)) {
            others.push(invocation);
        } else if (invocation.error) {
            lines.push(`⚠️ **${invocation.displayName}** failed`);
        } else {
            lines.push(takeDisplay(invocation.result) ?? `**${invocation.displayName}**`);
        }
    }
    message.mes = displayToHtml(lines.join('\n')) + otherToolsBlock(others);
}
