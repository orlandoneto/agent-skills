---
name: robots-txt-validator
description: >-
  Create or review robots.txt to block junk crawls without blocking vital pages. Use when the user asks for robots txt validator, seo, technical, or related SEO/link-building workflows.
license: MIT
---

# robots.txt validator

## Goal

Create or review robots.txt to block junk crawls without blocking vital pages.

## Inputs

Current robots.txt + critical URL list

## Instructions

1. Parse rules
2. Flag accidental blocks
3. Suggest safe disallow patterns
4. Remind about sitemap line

## Output

Validated robots.txt draft

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
