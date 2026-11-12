---
name: disavow-file-generator
description: >-
  From a backlink spreadsheet, flag toxic domains and format a Google disavow .txt. Use when the user asks for disavow file generator, seo, risk, or related SEO/link-building workflows.
license: MIT
---

# Disavow file generator

## Goal

From a backlink spreadsheet, flag toxic domains and format a Google disavow .txt.

## Inputs

Backlink export CSV + optional spam signals

## Instructions

1. Define toxicity heuristics (irrelevant, hacked, PBN-like)
2. Never disavow without evidence — mark uncertain as review
3. Output domain: lines for high confidence only
4. Explain residual risk

## Output

disavow.txt draft + review list

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
