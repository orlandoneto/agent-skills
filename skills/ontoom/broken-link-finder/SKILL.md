---
name: broken-link-finder
description: >-
  Find broken links on niche sites and propose the user's content as a replacement. Use when the user asks for broken link finder, seo, link-building, or related SEO/link-building workflows.
license: MIT
---

# Broken link finder

## Goal

Find broken links on niche sites and propose the user's content as a replacement.

## Inputs

Niche keywords + user's target URL(s)

## Instructions

1. Suggest Google operators / crawl targets for resource pages
2. List candidate pages likely to have outbound links
3. For each hit, note 404/outdated link and suggested replacement anchor
4. Draft a polite outreach email

## Output

Markdown/CSV table: page, broken URL, replacement, email draft

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
