---
license: MIT
name: research-brief-structure
description: Produces research briefs that answer a question — sources, synthesis, gaps, recommendation — rather than summaries that describe a topic. Use when a user needs to research a decision, investigate a market or tool, understand an unfamiliar domain quickly, or present findings to a stakeholder who wants an answer, not a report.
---

# Research Brief Structure

A brief answers a question. A summary describes a topic. Knowing the difference saves a lot of wasted effort.

## When to use

- A user needs to decide something and wants grounded reasoning, not just "read these articles."
- Evaluating a tool, vendor, market, or competitor.
- Onboarding into an unfamiliar domain (technology, industry, topic) quickly.
- Preparing for a stakeholder meeting where the deliverable is a recommendation, not a literature review.

## Before you start

Nail down:

1. **The question.** Specific, answerable, single. "Should we use Postgres or MongoDB?" is a question. "Database research" is not.
2. **The decision or action the brief supports.** A brief with no downstream decision tends to be unfocused. "Pick one by Friday" focuses it.
3. **Audience.** Technical peer, exec, cross-functional? Drives depth, vocabulary, how much context to include.
4. **Timebox.** 1 hour? 1 day? 1 week? Scope matches the time.
5. **What's already been done.** Prior briefs, opinions already formed, earlier research — skip relitigating, build on.

## Authoring workflow

1. **Restate the question** at the top, precisely. If you can't pin it down in one sentence, you don't know what you're researching.
2. **Gather sources.** Cast wide, include varied viewpoints. Note for each: who, what claim, how credible. See [source-evaluation.md](./references/source-evaluation.md).
3. **Synthesize.** Don't list sources — extract claims, note agreement / contradiction, identify gaps. See [synthesis-patterns.md](./references/synthesis-patterns.md).
4. **Identify gaps.** What did you want to know but couldn't find? What would change the recommendation if discovered?
5. **Recommend.** Take a position. Use the evidence; acknowledge uncertainty.
6. **Name the trigger to revisit.** If you learned X, the recommendation would flip. Spell that out so the reader can act on it later.

## The brief template

```markdown
# Brief: [Question] — [YYYY-MM-DD]

## Question
[Restated in one sentence. Who needs the answer and by when.]

## Recommendation
[One sentence. Specific. "Use Postgres" not "Postgres looks good." Confidence level: high / medium / low.]

## Reasoning
[3–5 bullets with the strongest evidence. Each bullet cites source.]

## Alternatives considered
- [Option B] — pros, cons, why not.
- [Option C] — pros, cons, why not.

## Risks and mitigations
- [Top 2–3 risks of the recommendation. For each: how to mitigate.]

## Gaps
- [What you couldn't confirm. What would change the answer.]

## Trigger to revisit
[Specific event or data point that would cause re-evaluation.]

## Sources
- [Title] — [author / org] — [link] — [credibility note].
- [Title] — [author / org] — [link] — [credibility note].
```

## Non-negotiable rules

- **Start with the recommendation.** Busy readers don't read to the end. Lead with the answer; back it up below.
- **Specific recommendation, not vibes.** "We should probably consider..." is not a recommendation. "Use X" is.
- **Cite what you claim.** Every non-obvious assertion has a source. "Industry standard" is not a source.
- **Use primary sources when possible.** Official docs > blog posts > tweets about blog posts about official docs.
- **Flag uncertainty explicitly.** "I couldn't find benchmarks for X at scale" is stronger than hiding the gap.
- **Include dissenting evidence.** If half of sources disagree with your recommendation, say so. Pretending the disagreement doesn't exist gets caught in review.
- **Time-bound the brief.** "This was researched on YYYY-MM-DD" matters. Fast-moving topics (new tech, vendor features) may be stale in 6 months.
- **Don't write in meandering paragraphs.** Bullets, tables, clear sections. Briefs are read fast; structure them for skimming.

## Length

- **One page** for decision briefs. Forces clarity.
- **Two pages max** for complex topics.
- **Appendices** for methodology, raw data, long quotes — but the front page stands alone.

## Output

The brief itself, plus:

- A 2-sentence TL;DR suitable for Slack / email.
- A 15-minute "walk me through it" talking script if the reader wants to be briefed orally.

## References

- [Brief template](./references/brief-template.md) — the full template with a worked example.
- [Source evaluation](./references/source-evaluation.md) — assessing credibility, primary vs secondary, spotting bias, red flags.
- [Synthesis patterns](./references/synthesis-patterns.md) — how to turn raw notes into a coherent brief: agree/disagree, cluster, contradict, find gaps.
