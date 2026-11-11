---
license: MIT
name: agent-skill-creator
description: Authors new skills for the agent-skills repo with consistent format — tight SKILL.md, frontmatter, references for depth, and a pre-merge checklist. Use when adding a new skill to github.com/Solonnikov/agent-skills, standardizing an existing skill, or auditing a skill's structure.
---

# Agent Skill Creator

Meta-skill for writing new skills in this repository. Enforces the format so every skill in the repo stays discoverable, lean, and useful.

## When to use

- Adding a new skill to `skills/`.
- Reviewing a PR that adds or modifies a skill.
- Refactoring an existing skill that has drifted from the format (too long, no references, missing frontmatter).

## Authoring workflow

1. **Pick a tight scope.** One skill = one job. If the description has "and" in it twice, split it.
2. **Choose a kebab-case name.** Matches the folder name. Short, specific — `wagmi-contract-interaction`, not `ethereum-stuff`.
3. **Create the folder** under `skills/<skill-name>/` with a `references/` subfolder.
4. **Write the SKILL.md frontmatter** (see [frontmatter rules](./references/frontmatter.md)).
5. **Draft a tight `SKILL.md`** — operational, not encyclopedic. Sections: short intro, When to use, Authoring workflow (or equivalent), Non-negotiable rules, References.
6. **Move depth to references.** Long templates, cheatsheets, checklists, step-by-step guides — all go in `references/*.md`, linked from SKILL.md by description.
7. **Run the [quality checklist](./references/quality-checklist.md)** before the PR.

## Non-negotiable rules

- Every skill has YAML frontmatter with `name` (kebab-case, matches folder) and `description` following the pattern `<what it does>. Use when <trigger>.`
- `SKILL.md` stays short enough for an agent to load cheaply — aim for under 80 lines.
- Depth goes in `references/`. Do not duplicate content between SKILL.md and a reference.
- Reference links in SKILL.md are **described by what they contain**, not by filename — e.g. `[Quality checklist](./references/quality-checklist.md) — pre-merge review against the non-negotiables.`
- Code examples in references use realistic placeholders (`<Feature>`, `<Token>`), not real addresses, secrets, or project-specific names.
- No emojis, no decorative headers, no "Note:" boxes — prefer plain prose.

## References

- [Frontmatter rules](./references/frontmatter.md) — required fields and pattern for the `description` line.
- [File layout](./references/file-layout.md) — folder structure, how references are organized, what belongs where.
- [Quality checklist](./references/quality-checklist.md) — pre-merge review against the non-negotiables.
