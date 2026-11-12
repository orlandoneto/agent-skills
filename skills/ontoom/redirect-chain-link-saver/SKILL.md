---
name: redirect-chain-link-saver
description: >-
  Find backlinks hitting old URLs stuck in redirect chains and fix destinations. Use when the user asks for redirect chain link saver, seo, technical, or related SEO/link-building workflows.
license: MIT
---

# Redirect chain link saver

## Goal

Find backlinks hitting old URLs stuck in redirect chains and fix destinations.

## Inputs

Backlink URLs + redirect map

## Instructions

1. Detect multi-hop 301 chains
2. Propose final destination mapping
3. Recommend updating links or shortening redirects
4. Estimate equity leakage risk

## Output

Chain report + fix list

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
