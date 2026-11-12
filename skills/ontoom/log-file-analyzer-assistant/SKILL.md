---
name: log-file-analyzer-assistant
description: >-
  Interpret server log samples to show where Googlebot spends crawl budget. Use when the user asks for log file analyzer assistant, seo, technical, or related SEO/link-building workflows.
license: MIT
---

# Log file analyzer assistant

## Goal

Interpret server log samples to show where Googlebot spends crawl budget.

## Inputs

Sample access logs (bot filtered if possible)

## Instructions

1. Summarize hit patterns
2. Find waste (params, faceted, soft 404)
3. Recommend crawl priorities
4. Do not invent log lines

## Output

Crawl budget insights

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
