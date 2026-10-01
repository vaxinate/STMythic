// Player slash commands: /fate, /scene, /chaos.
import { ODDS } from './fateChart.js';
import { getCF } from './state.js';
import { postResult } from './chat.js';
import { chaosAction, fateAction, sceneAction } from './actions.js';

async function post(result) {
    await postResult(result.display, result.prompt);
    return result;
}

export const playerFate = (odds, question, rng) => fateAction(odds, question, rng).then(post);
export const playerScene = () => post(sceneAction());
export const playerChaos = (delta, reason) => post(chaosAction(delta, reason));

export function registerCommands() {
    const { SlashCommandParser, SlashCommand, SlashCommandArgument, SlashCommandNamedArgument, ARGUMENT_TYPE } =
        SillyTavern.getContext();

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'fate',
        helpString: 'Ask the Mythic Fate Chart a yes/no question at the current Chaos Factor.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'odds',
                description: 'Odds of a yes',
                typeList: [ARGUMENT_TYPE.STRING],
                defaultValue: '50_50',
                enumList: ODDS,
            }),
        ],
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: 'question', typeList: [ARGUMENT_TYPE.STRING] }),
        ],
        callback: async (args, question) => {
            const odds = String(args.odds || '50_50');
            if (!ODDS.includes(odds)) {
                toastr.error(`Unknown odds "${odds}". Use one of: ${ODDS.join(', ')}`);
                return '';
            }
            return (await playerFate(odds, String(question ?? '').trim())).answer;
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'scene',
        helpString: 'Mythic scene check: d10 against the Chaos Factor (Expected / Altered / Interrupted).',
        callback: async () => (await playerScene()).result,
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'chaos',
        helpString: 'Adjust the Mythic Chaos Factor by +1 or -1. With no argument, shows the current value.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: '+1 or -1', typeList: [ARGUMENT_TYPE.NUMBER], enumList: ['+1', '-1'] }),
        ],
        callback: async (_args, value) => {
            const raw = String(value ?? '').trim();
            if (!raw) {
                toastr.info(`Chaos Factor: ${getCF()}`);
                return String(getCF());
            }
            const delta = Number(raw);
            if (delta !== 1 && delta !== -1) {
                toastr.error('Use /chaos +1 or /chaos -1');
                return '';
            }
            return String((await playerChaos(delta)).to);
        },
    }));
}
