---
name: js-rendering-seo-checker
description: >-
  Identify critical content/links that depend on JS and may be missed by bots. Use when the user asks for js rendering seo checker, seo, technical, or related SEO/link-building workflows.
license: MIT
---

# JS rendering SEO checker

## Goal

Identify critical content/links that depend on JS and may be missed by bots.

## Inputs

URL or framework notes + HTML samples

## Instructions

1. Compare raw HTML vs rendered expectations
2. Flag client-only content
3. Recommend SSR/prerender where needed
4. List test steps

## Output

Rendering risk report

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
