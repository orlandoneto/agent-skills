---
license: MIT
name: prompt-engineering-patterns
description: Structures prompts for LLM applications — role usage, delimiters, chain-of-thought, few-shot examples, structured output, prompt caching, and when to stop tuning and reach for RAG or fine-tuning instead. Use when building an LLM feature, rewriting a flaky prompt, moving from a prototype to production, or reviewing prompts in code review.
---

# Prompt Engineering Patterns

Practical patterns for writing prompts that work in production. Covers structure, techniques that actually move accuracy, structured output, caching, and when prompting is the wrong tool.

## When to use

- Building a new LLM-powered feature.
- Rewriting a prompt that works in dev but fails on real traffic.
- Moving from a prototype to production — where cost, latency, and reliability matter.
- Reviewing prompts in code review.
- Deciding between "better prompt" vs "RAG" vs "fine-tune".

## Before you start

Know these five things before writing a prompt:

1. **Task type.** Classification, extraction, generation, reasoning, tool use? The technique that helps depends on this.
2. **Input distribution.** What do real inputs actually look like? Your five hand-picked test cases lie.
3. **Success metric.** "Good" means nothing. Define exact accuracy, latency, cost, and failure-mode targets.
4. **Model.** Prompt patterns that shine on frontier models (Claude Opus/Sonnet 4.x, GPT-5.x) are different from what's needed for smaller/open models. Never ship a prompt without testing on the exact model you'll deploy.
5. **Inference budget.** A 1,500-token prompt with five-shot examples and CoT is not free at scale. Measure cost per call before committing to a pattern.

## Authoring workflow

1. **Write the spec first.** In plain English, describe what the prompt should do, with at least one concrete example input and the exact output format expected.
2. **Start minimal.** One-sentence task description + input. See how far the model gets without help.
3. **Add structure when it fails.** Role separation (system/user/assistant), delimiters (XML tags), explicit output format.
4. **Add examples when it still fails.** Few-shot with 2–5 high-quality, diverse examples.
5. **Add reasoning when the task needs it.** Chain-of-thought for multi-step reasoning. Skip for simple classification or extraction — it adds latency.
6. **Evaluate on a real dataset.** Not vibes. Run the prompt against 50–200 real inputs and score outputs. Track accuracy, latency, and cost.
7. **Iterate on the single worst failure mode.** Not "make it better overall". Pick the specific failure pattern, fix the prompt for that, re-evaluate.

## Non-negotiable rules

- **Never paste secrets, customer data, or internal-only information into a prompt you log.** Prompts end up in observability tools. Redact before sending.
- **Use the system role for instructions, the user role for input.** Many models treat system prompts with higher priority and different safety settings.
- **Prefer structured output over parsing free text.** Use the provider's structured output / JSON mode / tool use APIs. Regex-parsing LLM output is a bug farm.
- **Cache what repeats.** Prompt caching (Claude, OpenAI) on the static portion of a long prompt cuts cost 80–90% and latency 50%+. Rewrite to put stable content first.
- **Never trust the model to count, sort, or do arithmetic** above trivial levels. Use tools (code execution, calculator) for anything numeric.
- **Don't tell the model "don't hallucinate".** That instruction has no mechanism. Ground its claims: provide sources, ask it to cite, and use RAG when facts matter.
- **Versions matter.** Pin the exact model version in code and config, not `-latest`. Behavior changes between versions; your evals lock in a known-good version.

## When prompting is the wrong tool

- **You need facts the model doesn't know.** Use RAG — retrieval + grounding — not prompt stuffing.
- **You have thousands of labeled examples and a narrow task.** Fine-tune a smaller model. Cheaper and faster at scale.
- **You need 100% deterministic output.** Use code. LLMs are probabilistic.
- **The task has structured inputs and outputs that a regex or parser handles.** Don't use an LLM to parse dates.

## References

- [Prompt structure](./references/structure.md) — roles, delimiters, section ordering, and what each piece is for.
- [Techniques that move accuracy](./references/techniques.md) — few-shot, chain-of-thought, self-consistency, prompt chaining — when each one helps and when it hurts.
- [Structured output](./references/structured-output.md) — JSON mode, tool use / function calling, schemas, refusal and fallback handling.
- [Prompt caching](./references/caching.md) — how it works across Claude and OpenAI, how to structure prompts to maximize cache hits, latency + cost numbers.
- [Evaluation](./references/evaluation.md) — how to actually test prompts: golden sets, LLM-as-judge, regression tracking in CI.
