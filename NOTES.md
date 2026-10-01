# Notes

## To verify against the Mythic GME 2e book
- [ ] Fate Chart thresholds in `src/fateChart.js` (currently the 2e ladder from memory)
- [ ] Can CF stay the same at scene end? (`mythic_chaos` allows change = 0)
- [ ] Scene check: d10 ≤ CF, odd = Altered, even = Interrupted
- [ ] Random event: doubles 11–99 with digit ≤ CF (100 never triggers)

## Phase 0 findings (ST release @ 06bde93, verified live + in source)
- **Tool-call display:** ST saves a system message whose `mes` is a `<details>` block of JSON with
  every call's *parameters and result* (`tool-calling.js` `saveFunctionToolInvocations`). So
  `mythic_scene`'s `expected` would leak through the parameters as well as the result.
- **Hiding works:** the prompt is built from `extra.tool_invocations` (`openai.js`), not `mes`.
  `TOOL_CALLS_PERFORMED` fires after `chat.push` and before render, so rewriting
  `chat.at(-1).mes` there shows only our summary and still gives the model the full result.
  Verified: DOM showed the summary; `extra.tool_invocations[0].result` kept the full text.
  Decision: use this for all `mythic_*` tools (it replaces options a, b and c).
- **Popups in tools:** `invokeFunctionTool` just awaits `action`, with no timeout. Awaiting
  `Popup.show.confirm` inside a tool works (verified). The `formatMessage` toast stays up
  (timeOut 0) until the action returns.
- **`stealth: true`:** the invocation isn't saved and there's no follow-up generation. It
  doesn't suit us, because the narrator needs the result.
- **`shouldRegister`:** checked each time the tool list is built for a request, so it can
  gate tools on settings dynamically.
- **Still to test live with a model:** the full round trip through a real Chat Completion API.

## Known limitations
- **Player results reach the narrator through a generate interceptor**, which ST skips on
  dry runs, so the prompt inspector doesn't show them. Real generations do include them.
- **Swiping doesn't undo `mythic_chaos`.** The tool-call message is separate from the reply
  being swiped. Use `/chaos` or the bar's −/+ instead.
- **Tool-call messages are rendered as raw HTML.** ST skips markdown for "SillyTavern System"
  messages and its CSS hides `<br>`, so our summaries use `<div>` lines and `<strong>`.
