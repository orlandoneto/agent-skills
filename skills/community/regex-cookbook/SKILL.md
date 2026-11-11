---
license: MIT
name: regex-cookbook
description: Copy-ready regex patterns for the 20 strings people actually match every day — emails, URLs, UUIDs, semver, IPs, dates, line-level patterns — plus the building blocks, language-specific pitfalls, and debugging workflow. Use when a user asks for a regex for a common string format, needs to extract or validate something, or is debugging a regex that isn't matching what they expect.
---

# Regex Cookbook

Pre-built regex patterns for the strings you match most often, with the building blocks to customize them and the gotchas that trip people up.

## When to use

- Writing a validator for an email, URL, UUID, semver, IP, date, etc.
- Extracting structured data from logs, output, or free-form text.
- Doing a search-and-replace with a complex find pattern.
- Debugging a regex that "should match" but doesn't.
- Translating a regex between languages (JS ↔ Python ↔ PCRE ↔ Go).

## Before you start

Three things to know about the target:

1. **Which regex flavor?** JavaScript, Python, PCRE (grep/sed/ripgrep), Go's RE2, .NET — they differ. If you use a JS regex in a Go program, some features silently fail.
2. **What do you need — match, validate, or extract?** Validation is stricter than matching. Extraction usually needs capture groups.
3. **What's the input distribution?** The "RFC-compliant email regex" is 6,300 characters. You almost never want it. The real question is: what do *your* inputs look like?

## Workflow

1. **Start from a recipe** in [common-patterns.md](./references/common-patterns.md) — don't write from scratch. The common cases are solved.
2. **Tighten or loosen** to match your actual input distribution.
3. **Test** with [regex101.com](https://regex101.com/) using the right flavor. Paste real inputs; see which match and which don't.
4. **Guard against ReDoS** — patterns with nested quantifiers (`(a+)+`) can take exponential time on crafted input. See [debugging-regex.md](./references/debugging-regex.md).
5. **Document the pattern** — a comment with an example input is worth 10 minutes of future puzzlement.

## Non-negotiable rules

- **Don't validate emails with a regex more than ~20 characters long.** Use `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` and then send a confirmation email. Perfect validation is impossible; confirmation is possible.
- **Anchor your patterns** with `^` and `$` when validating. Unanchored regex with `match` happily accepts "totally bogus but contains a valid substring somewhere."
- **Prefer `\d` over `[0-9]`**, `\w` over `[A-Za-z0-9_]`, `\s` over `[ \t\n\r]`. Terser and less error-prone. Know the exceptions: `\d` matches Unicode digits in some flavors but only ASCII in others.
- **Use non-capturing groups** `(?:...)` when you don't need the capture. Capture groups are memory; non-capturing are free.
- **Use named groups** `(?<year>\d{4})` when you have more than 2 groups. Makes the code readable and refactor-safe.
- **Don't parse structured formats with regex.** HTML, JSON, XML, YAML — use a parser. Regex is for flat, line-oriented text.
- **Assume any regex touching user input can ReDoS.** Either use a linear-time engine (Go's RE2, Rust's `regex`) or write patterns that can't backtrack catastrophically.

## References

- [Common patterns](./references/common-patterns.md) — copy-ready patterns for email, URL, UUID, semver, IP, dates, phone, HEX color, strings, numbers, log-line extraction.
- [Building blocks](./references/building-blocks.md) — anchors, character classes, quantifiers, groups, lookaround — the primitives to compose new patterns.
- [Language differences](./references/language-differences.md) — JavaScript vs Python vs PCRE vs Go/RE2 vs .NET — what each supports, what the gotchas are.
- [Debugging regex](./references/debugging-regex.md) — how to test, how to read backtracking behavior, ReDoS, common mistakes.
