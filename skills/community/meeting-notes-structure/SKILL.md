---
license: MIT
name: meeting-notes-structure
description: Produces meeting notes that capture decisions and action items — not transcription. Attendees, agenda, decisions, action items with owners and deadlines. Use when a user needs notes from a meeting that's about to happen, is happening, or just ended, or wants a template for recurring meetings.
---

# Meeting Notes Structure

A tight, consistent template for notes anyone can read six months later and know what happened.

## When to use

- A user is taking notes during or after a meeting.
- They need a template for a recurring meeting (standup, 1-on-1, retro, planning).
- They have a raw transcript / recording and want to extract notes from it.
- They're prepping an agenda for a meeting that hasn't happened yet.

## Before you start

Know:

1. **Meeting type.** Standup, 1-on-1, retro, planning, kickoff, status, decision. Changes structure. See [meeting-types.md](./references/meeting-types.md).
2. **Audience for the notes.** Attendees only? Wider team? Public customer update? Drives what you include and what you leave out.
3. **Sensitivity.** Performance, comp, layoffs, legal — different rules (fewer specifics, named owner for follow-up, flagged confidential).

## Authoring workflow

1. **Before the meeting**: write the agenda into the notes template. Attendees, expected outcomes, questions to decide.
2. **During the meeting**: capture decisions and action items in real time. Full sentences where it matters; fragments are fine for context.
3. **After the meeting** (within 15 min): clean up, move action items to the top, confirm owners/deadlines, send to attendees.
4. **Don't transcribe.** Notes are not a recording. Capture *decisions and actions*, skip the discussion that led there unless it's load-bearing.

## The core template

```markdown
# [Meeting name] — [YYYY-MM-DD]

**Attendees**: [Names, flag missing people]
**Absent**: [Names, if expected but absent]
**Purpose**: [One sentence]

## Action items

| Owner | Task | Due |
|-------|------|-----|
| @alice | Draft the RFC | 2026-05-01 |
| @bob   | Get legal review | 2026-04-29 |

## Decisions

- Decided to ship option B (defer option A to next quarter). Reasoning: cost of A is ~2x, benefit similar.
- Decided to extend the deadline to 2026-05-15 to accommodate legal review.

## Discussion notes

[Only the bits that matter for context. Short.]

## Open questions

- How do we handle migration for existing users? — owner: alice, target date for answer: 2026-04-29.

## Next meeting

2026-04-30, 14:00 UTC. Agenda: review RFC, legal feedback.
```

## Non-negotiable rules

- **Action items have an owner and a deadline.** No owner = nobody does it. No deadline = it never happens. Both required.
- **Use `@name` for owners.** Not "the team", not "we", not "someone". A single person.
- **Decisions section is just decisions.** Not discussions. "We decided X because Y." If there's no decision, don't fake one.
- **Action items go first.** Most readers just want to know what they owe. Put it at the top, above the discussion.
- **Decisions use past tense.** "Decided to ship B." Not "will ship B" (that's an action item) and not "discussed shipping B" (that's nothing).
- **Don't transcribe.** A paragraph-long summary of discussion defeats the point. Notes ≠ recording.
- **Share within 15 minutes.** Notes sent two days later get read by nobody.
- **Flag missing people.** If a decision was made without a key person, flag it: "⚠️ Alice not present; confirm with her before executing."

## Output

- For live-note use: fill the template during the meeting, clean up after.
- For transcript-to-notes: extract decisions + action items + open questions into the template structure. Ignore the small talk.
- For prep: fill the top half (attendees, purpose, agenda, open questions); leave action items + decisions blank.

## References

- [Template](./references/template.md) — the full copy-paste template, with examples and variants.
- [Action items](./references/action-items.md) — what makes a good action item, how to write them so they actually get done.
- [Meeting types](./references/meeting-types.md) — standups, 1-on-1s, retros, planning, kickoff, status — template variations for each.
