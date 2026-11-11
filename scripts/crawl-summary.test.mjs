import test from "node:test";
import assert from "node:assert/strict";
import { buildCrawlSummaryMarkdown } from "./lib/crawl-summary.mjs";

test("resumo lista novos com data e histórico do catálogo", () => {
  const md = buildCrawlSummaryMarkdown({
    day: "2026-11-11",
    report: {
      published: [{ id: "deploy-to-vercel", sourceUrl: "https://example.com/x" }],
      skipped: [{ id: "doc-coauthoring", reason: "já publicado (id)" }],
      held: [],
    },
    candidates: [{ id: "deploy-to-vercel" }],
    rejected: [
      { reason: "duplicata de foo" },
      { reason: "duplicata de bar" },
      { reason: "pasta scripts/ → só review" },
    ],
    catalogSkills: [
      { id: "deploy-to-vercel", addedAt: "2026-11-11" },
      { id: "seo-meta-audit", addedAt: "2026-11-10" },
      { id: "academy-guide", updatedAt: "2026-11-10" },
    ],
  });

  assert.match(md, /Novos publicados:\*\* 1/);
  assert.match(md, /\*\*deploy-to-vercel\*\* — 2026-11-11/);
  assert.match(md, /## Quando foram adicionados/);
  assert.match(md, /\*\*2026-11-11\*\* — 1: deploy-to-vercel/);
  assert.match(md, /2× duplicata/);
});

test("resumo sem novos deixa mensagem clara", () => {
  const md = buildCrawlSummaryMarkdown({
    day: "2026-11-11",
    report: { published: [], skipped: [], held: [] },
    candidates: [],
    rejected: [],
    catalogSkills: [],
  });
  assert.match(md, /Nenhum skill novo SAFE hoje/);
});
