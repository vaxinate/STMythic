// Oracle bar above the chat input: Chaos Factor, odds buttons, and a scene check.
import { ODDS, ODDS_LABELS } from './fateChart.js';
import { getCF, getSettings, onCFChange, saveSettings } from './state.js';
import { playerChaos, playerFate, playerScene } from './commands.js';

const SHORT_LABELS = {
    impossible: 'Imp',
    nearly_impossible: 'N.Imp',
    very_unlikely: 'V.Unl',
    unlikely: 'Unl',
    '50_50': '50/50',
    likely: 'Lik',
    very_likely: 'V.Lik',
    nearly_certain: 'N.Cert',
    certain: 'Cert',
};

let bar;
let busy = false;

/** Ignores clicks while a roll (and its popups) is in progress. */
async function run(action) {
    if (busy) return;
    busy = true;
    bar.addClass('mythic-busy');
    try {
        await action();
    } catch (error) {
        console.error('[Mythic Oracle]', error);
        toastr.error(String(error?.message ?? error), 'Mythic Oracle');
    } finally {
        busy = false;
        bar.removeClass('mythic-busy');
    }
}

async function askFate(odds) {
    const { Popup } = SillyTavern.getContext();
    const question = await Popup.show.input(`Fate: ${ODDS_LABELS[odds]}`, 'Your yes/no question (optional):', '');
    if (question === null || question === undefined) return;
    await playerFate(odds, String(question).trim());
}

function button(label, title, onClick, className = '') {
    return $('<div class="menu_button mythic-bar-button"></div>')
        .addClass(className)
        .text(label)
        .attr('title', title)
        .on('click', () => run(onClick));
}

export function refreshPanel() {
    if (!bar) return;
    const { getCurrentChatId } = SillyTavern.getContext();
    bar.toggle(Boolean(getCurrentChatId()));
    bar.find('.mythic-cf-value').text(getCF());
    bar.toggleClass('mythic-collapsed', Boolean(getSettings().panelCollapsed));
}

export function renderPanel() {
    bar = $('<div id="mythic_bar"></div>');

    const toggle = $('<div class="mythic-bar-toggle fa-solid fa-dice-d20" title="Mythic Oracle (click to collapse)"></div>')
        .on('click', () => {
            const settings = getSettings();
            settings.panelCollapsed = !settings.panelCollapsed;
            saveSettings();
            refreshPanel();
        });

    const chaos = $('<div class="mythic-cf" title="Chaos Factor"></div>').append(
        button('−', 'Chaos Factor −1', () => playerChaos(-1)),
        $('<span class="mythic-cf-label">CF</span>'),
        $('<span class="mythic-cf-value"></span>'),
        button('+', 'Chaos Factor +1', () => playerChaos(1)),
    );

    const odds = $('<div class="mythic-odds"></div>').append(
        ODDS.map(o => button(SHORT_LABELS[o], `Fate question: ${ODDS_LABELS[o]}`, () => askFate(o), o === '50_50' ? 'mythic-even' : '')),
    );

    const scene = button('Scene', 'Scene check (d10 vs Chaos Factor)', () => playerScene(), 'mythic-scene');

    bar.append(toggle, $('<div class="mythic-bar-body"></div>').append(chaos, odds, scene));
    $('#send_form').before(bar);

    onCFChange(refreshPanel);
    refreshPanel();
}
