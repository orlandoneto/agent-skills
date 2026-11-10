---
name: commit-conventional
description: Writes Conventional Commits (feat, fix, docs, chore) with a clear why. Use when the user asks for a commit message, git commit text, or to summarize a diff.
license: MIT
---

# Commit conventional

## Instructions

1. Inspect the staged or described changes.
2. Choose type: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
3. Subject ≤ 72 chars, imperative, focus on **why**.
4. Body optional: what risk was avoided or what contract changed.
5. Never suggest committing `.env`, keys, or credentials.

## Example

```
feat: add per-skill ZIP downloads for the catalog

Keep GitHub Releases as the only binary host so the site stays a discovery layer.
```
