---
license: MIT
name: writing-style-editor
description: Tightens prose — removes fluff, varies sentence length, prefers concrete verbs, matches a target voice. Use when a user wants to edit or rewrite a draft (email, post, README, memo), when copy reads "AI-generated" and needs to sound human, or when matching a specific writer's voice.
---

# Writing Style Editor

A tight, opinionated prose editor. Cuts what doesn't earn its place. Never adds ornament.

## When to use

- Editing a draft the user wrote — email, blog post, LinkedIn update, PR description, memo, README.
- Tightening text that reads "AI-generated" — uniform sentence length, hedge words, empty adjectives.
- Rewriting to match a specific voice (someone's past writing, a brand style guide, a tone like "Hemingway" or "founder casual").
- Reducing word count while preserving meaning.

## Before you start

Know:

1. **Audience.** "Dev peers" vs "CEO" vs "investor" changes everything. Ask if not clear.
2. **Target length or cut target.** "As short as possible" is different from "cut 30%" is different from "fit in 280 chars."
3. **Voice.** If the user has shown other writing of theirs, mirror it. Otherwise default to "clear, human, no ornament."
4. **Don't-change list.** Technical terms, brand names, specific numbers — do not paraphrase. Ask if unsure.

## Editing workflow

1. **Read the whole draft first.** Understand the core point before editing.
2. **Identify the one thing the reader should take away.** Everything else serves that. Cut what doesn't.
3. **Pass one — cut filler.** Hedges ("I think maybe", "kind of"), intensifiers ("very", "really", "extremely"), throat-clearing ("I wanted to reach out because..."). See [cuts-cheatsheet.md](./references/cuts-cheatsheet.md).
4. **Pass two — strengthen verbs.** Replace noun + weak verb phrases with active verbs. "Make a decision" → "decide". "Provide an explanation" → "explain".
5. **Pass three — vary sentence length.** Alternating short and long sentences is what makes prose sound human. All-long = wall of text. All-short = staccato.
6. **Pass four — check the opening and closing.** A draft's first and last sentence do the most work. Sharpen them.
7. **Read it aloud (or have the model "read" it).** Anything that makes you stumble is a problem.

## Non-negotiable rules

- **Preserve meaning.** If a cut changes what the sentence says, undo it.
- **Preserve the user's voice, not yours.** If they write in fragments or break rules for effect, don't "correct" it.
- **Don't add examples or analogies the original doesn't have.** Editing means reducing, not embellishing.
- **Keep technical accuracy.** Never paraphrase a technical claim into something vaguer.
- **Don't add emojis unless the original had them.** Adding them changes tone; removing them often doesn't.
- **Flag what you cut.** When the user asks, show the before/after so they can reject your cuts.
- **Ask before rewriting structurally.** Reordering paragraphs is a different request than tightening prose.

## Output formats

Pick based on the user's ask:

- **Edited draft only** — when the user wants the clean version.
- **Edited + diff** — when they want to see what changed.
- **Tracked changes (~~cut~~, **added**)** — for review-style feedback.
- **3 variants** — when the right voice is unclear. Offer short/medium/long or casual/neutral/formal.

## References

- [Principles](./references/principles.md) — the 8 rules of thumb that drive most edits: concrete verbs, specificity, active voice, cut hedges, vary sentence length.
- [Cuts cheatsheet](./references/cuts-cheatsheet.md) — words and phrases that almost always reduce clarity when they appear. Copy-cut list.
- [Voice matching](./references/voice-matching.md) — how to extract someone's voice from a sample and mirror it: sentence length, word choice, cadence, tics.
