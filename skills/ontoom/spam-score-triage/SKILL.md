---
name: spam-score-triage
description: >-
  Triage thousands of backlinks by risk using quality and topical relevance. Use when the user asks for spam score triage, seo, risk, or related SEO/link-building workflows.
license: MIT
---

# Spam score triage

## Goal

Triage thousands of backlinks by risk using quality and topical relevance.

## Inputs

Large backlink export

## Instructions

1. Bucket high/medium/low risk
2. Separate review vs ignore vs disavow-candidates
3. Explain heuristics used
4. Cap actions to high-confidence

## Output

Triaged CSV/markdown buckets

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
