---
license: MIT
name: technical-seo-checklist
description: Audits and implements the technical SEO basics any modern web app should ship with — metadata, structured data, crawlability, Core Web Vitals, and international targeting. Use when launching a new site, auditing an existing one, or reviewing a PR that touches routing, rendering, or head tags.
---

# Technical SEO Checklist

Practical technical SEO for modern web apps (Next.js, Angular, SvelteKit, plain HTML). Covers the pieces that actually move search ranking — not link-building, not content strategy.

## When to use

- Launching a new site and making sure it's indexable.
- Auditing an existing site where organic traffic is below expectations.
- Reviewing a PR that touches `<head>`, routing, or rendering.
- Migrating frameworks (e.g. React CSR → Next.js SSR) and wanting to preserve rankings.
- Rolling out internationalization.

## Before you start

Know these:

1. **Rendering model** — CSR, SSR, SSG, or ISR? Google indexes all of them now, but CSR still costs you. Anything commerce- or SEO-critical should be server-rendered.
2. **Target audience and language(s)** — one language or many? Same content or localized?
3. **Existing ranking**, if any. Migrations that break URLs lose rankings; you need a 301 map before launch, not after.
4. **What tooling you have** — Google Search Console, Lighthouse, CrUX, Ahrefs/Semrush, PageSpeed Insights. At minimum, Search Console + Lighthouse + a crawler (Screaming Frog free tier).
5. **What "success" looks like** — organic clicks, keyword rankings, indexed-page count, Core Web Vitals scores. Pick 2–3 metrics and track them monthly.

## Audit workflow

1. **Crawl the site.** Screaming Frog (or equivalent) — get a list of every URL, status code, title, description, canonical, indexability.
2. **Check indexability of every important page.** `robots.txt`, `meta robots`, canonical, blocked by auth, `noindex` accidentally set. Most "why isn't this ranking" bugs live here.
3. **Check the `<head>`** on representative pages — title, description, canonical, Open Graph, viewport, lang, charset.
4. **Check structured data.** [Rich Results Test](https://search.google.com/test/rich-results) for templates that should qualify (article, product, recipe, FAQ, breadcrumb).
5. **Check Core Web Vitals** on real traffic via [CrUX](https://chromeuxreport.com/) or Search Console → Core Web Vitals.
6. **Check mobile usability** — viewport, tap targets, text legibility, responsive breakpoints.
7. **Check international setup** if multi-language — `hreflang`, language-specific URLs, consistent canonical strategy.
8. **Submit sitemap.** Every discovered URL in `sitemap.xml`; sitemap registered in Search Console.

## Non-negotiable rules

- **Every indexable page has a unique `<title>` and `<meta description>`.** Duplicates waste crawl budget and confuse ranking.
- **Every page has a canonical URL.** Self-referencing on originals, pointing to the canonical on duplicates. Don't set canonical to the homepage for every page — that's a common bug that tanks indexation.
- **One `<h1>` per page, describing the page content.** Not the site name.
- **Images have `alt` text, `width`, and `height`.** Alt helps accessibility and image search. Width/height prevents Cumulative Layout Shift (CLS).
- **Mobile viewport meta tag is set**: `<meta name="viewport" content="width=device-width, initial-scale=1">`. Missing this fails mobile usability immediately.
- **Don't rely on client-side rendering alone for content you want indexed.** Googlebot renders JS, but slowly and inconsistently. SSR or SSG your important pages.
- **Never redirect 302 for permanent moves.** Use 301. 302s don't pass ranking.
- **Never `noindex` pages unintentionally.** Check staging configs don't leak `X-Robots-Tag: noindex` into production. This is the #1 traffic-killer at launch.

## References

- [Metadata and head tags](./references/metadata.md) — title, description, canonical, Open Graph, Twitter cards, favicons, viewport.
- [Structured data (Schema.org / JSON-LD)](./references/structured-data.md) — which types actually show rich results, how to implement, how to validate.
- [Crawlability](./references/crawlability.md) — `robots.txt`, `sitemap.xml`, `meta robots`, `X-Robots-Tag`, pagination, faceted navigation traps.
- [Core Web Vitals](./references/performance.md) — LCP, INP, CLS — what they are, how to measure, the specific patterns that fix each one.
- [International SEO](./references/international.md) — `hreflang`, URL patterns for i18n, language detection vs explicit selection.
