/**
 * Gera staging/crawl-summary-YYYY-MM-DD.md + GitHub Step Summary.
 * Roda após publish-safe / catalog:build na Action.
 */
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCrawlSummaryMarkdown,
  latestCandidatesDay,
  loadDayArtifacts,
} from "./lib/crawl-summary.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const day = process.env.CRAWL_DAY || latestCandidatesDay(root);
const { report, candidates, rejected, catalogSkills } = loadDayArtifacts(root, day);

const md = buildCrawlSummaryMarkdown({
  day,
  report,
  candidates,
  rejected,
  catalogSkills,
});

const stagingDir = path.join(root, "staging");
mkdirSync(stagingDir, { recursive: true });
const outFile = path.join(stagingDir, `crawl-summary-${day}.md`);
writeFileSync(outFile, md.endsWith("\n") ? md : md + "\n", "utf8");
console.log(md);
console.log(`\nsummary → ${path.relative(root, outFile)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n", "utf8");
}

if (!existsSync(outFile)) process.exit(1);
