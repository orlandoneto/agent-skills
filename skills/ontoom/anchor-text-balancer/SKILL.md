---
name: anchor-text-balancer
description: >-
  Analyze exact/partial/branded/generic anchors and warn about over-optimization. Use when the user asks for anchor text balancer, seo, risk, or related SEO/link-building workflows.
license: MIT
---

# Anchor text balancer

## Goal

Analyze exact/partial/branded/generic anchors and warn about over-optimization.

## Inputs

Anchor text export

## Instructions

1. Bucket anchors
2. Compute shares
3. Flag risky exact-match spikes
4. Recommend healthier targets

## Output

Distribution table + recommendations

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
