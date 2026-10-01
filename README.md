# Mythic Oracle

A [Mythic GME 2e](https://www.wordmillgames.com/mythic-game-master-emulator.html) oracle for solo play in SillyTavern. It keeps a per-chat Chaos Factor, rolls the Fate Chart and scene checks, and lets the narrator model consult the oracle through tool calls, with the player confirming odds and entering table results from the book.

## Install

In SillyTavern: **Extensions → Install extension**, and paste this repo's git URL. For development, symlink the repo instead:

```bash
ln -s "$PWD" /path/to/SillyTavern/public/scripts/extensions/third-party/STMythic
```

The model tools need a **Chat Completion** API that supports function calling, with **Enable function calling** turned on in the AI Response Configuration panel. The slash commands and oracle bar work with any API.

## Playing

The **oracle bar** above the chat input shows the Chaos Factor (with −/+), one button per odds level, and **Scene**. Clicking an odds button asks for your question and rolls. The 🎲 icon collapses the bar.

| Command | What it does |
|---|---|
| `/fate odds=likely Is the door locked?` | Rolls d100 on the Fate Chart at the current CF. Doubles ≤ CF open the random event popup. |
| `/scene` | d10 vs CF: odd ≤ CF is Altered, even ≤ CF is Interrupted, otherwise Expected. |
| `/chaos +1`, `/chaos -1`, `/chaos` | Adjusts, or shows, the Chaos Factor (1–9, starting at 5 in each chat). |

Each result is posted to chat and passed to the narrator on its next reply as binding.

### Model tools

| Tool | Flow |
|---|---|
| `mythic_fate(question, odds)` | Popup shows the question and suggested odds; you pick the odds; the extension rolls. Random events open a second popup. |
| `mythic_scene(expected)` | The model commits to its planned scene, then the extension rolls. Chat shows only the outcome; the plan stays hidden. |
| `mythic_chaos(change, reason)` | Applied at scene end with no confirmation. Use `/chaos` to undo. |
| `mythic_table(table, rolls)` | Rolls 1–2 d100s and asks you to type the results from the book. |

Canceling any popup tells the narrator "Player declined; improvise."

### Oracle nudge

Models tend to call `mythic_scene` reliably but invent answers instead of calling `mythic_fate` or `mythic_table`. After a set number of narrator replies (default 3) without either of those calls, the next generation gets a hidden one-shot reminder to resolve uncertain facts through the oracle. Player rolls, scene checks and chaos changes don't reset the count. The oracle bar shows "Oracle idle: n/3" so you can see the next nudge coming.

The scene loop: at scene end the model calls `mythic_chaos`, then `mythic_scene` for the next scene, then play continues. The first scene of a session isn't checked.

## Settings

**Extensions → Mythic Oracle** holds:
- the oracle nudge switch, threshold (1–10), reminder text (`{{count}}` and ST macros work) and idle counter toggle
- the `mythic_fate` description
- the meaning table registry (one `Name | when to use` per line) and the `mythic_table` description template, where `{{tables}}` becomes the list

Editing a description or the table list updates the tool immediately. Each text field has a reset button.

## Development

```bash
npm test
```

Runs the dice, Fate Chart, injection, and table-registry tests under Node, without SillyTavern. See [NOTES.md](NOTES.md) for how SillyTavern handles tool calls and what still needs checking against the book.

## License

AGPL-3.0, the same as SillyTavern. See [LICENSE](LICENSE).
