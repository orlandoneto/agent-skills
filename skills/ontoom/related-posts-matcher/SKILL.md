---
name: related-posts-matcher
description: >-
  Pick the 3 most semantically relevant posts for end-of-article modules. Use when the user asks for related posts matcher, seo, architecture, or related SEO/link-building workflows.
license: MIT
---

# Related posts matcher

## Goal

Pick the 3 most semantically relevant posts for end-of-article modules.

## Inputs

Current post + candidate list

## Instructions

1. Score topical similarity
2. Avoid near-duplicates
3. Suggest titles/anchors
4. Explain choices

## Output

Top 3 related + reasons

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
