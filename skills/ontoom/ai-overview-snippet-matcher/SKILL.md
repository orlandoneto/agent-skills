---
name: ai-overview-snippet-matcher
description: >-
  Adapt content to fill gaps in AI-generated overview style answers. Use when the user asks for ai overview snippet matcher, seo, geo, or related SEO/link-building workflows.
license: MIT
---

# AI Overview snippet matcher

## Goal

Adapt content to fill gaps in AI-generated overview style answers.

## Inputs

Query + observed AI overview notes + draft

## Instructions

1. Extract missing facets
2. Add concise factual blocks
3. Use lists/tables where helpful
4. Cite sources

## Output

Gap-fill edits

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
