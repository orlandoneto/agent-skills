---
name: http-status-code-triage
description: >-
  Prioritize 4xx/5xx lists from crawlers like Screaming Frog. Use when the user asks for http status code triage, seo, technical, or related SEO/link-building workflows.
license: MIT
---

# HTTP status code triage

## Goal

Prioritize 4xx/5xx lists from crawlers like Screaming Frog.

## Inputs

Status code export

## Instructions

1. Bucket by severity
2. Separate soft 404s
3. Assign owners/actions
4. Propose redirect vs remove

## Output

Prioritized fix queue

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
