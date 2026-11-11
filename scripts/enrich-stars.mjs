/**
 * Anexa sourceStars (estrelas do repo upstream) em cada skill do catalog.json.
 * 1 request por repo único — barato e free com GITHUB_TOKEN.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPolicy } from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const catalogPath = path.join(root, "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const headers = {
  "User-Agent": policy.crawler.userAgent,
  Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}`;
}

function repoFromSkill(skill) {
  const url = skill.sourceUrl || "";
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (m) return `${m[1]}/${m[2]}`;
  if (skill.origin === "ontoom") return "orlandoneto/agent-skills";
  return null;
}

const cache = new Map();

async function starsFor(repo) {
  if (!repo) return null;
  if (cache.has(repo)) return cache.get(repo);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!res.ok) {
      cache.set(repo, null);
      return null;
    }
    const data = await res.json();
    const n = typeof data.stargazers_count === "number" ? data.stargazers_count : null;
    cache.set(repo, n);
    return n;
  } catch {
    cache.set(repo, null);
    return null;
  }
}

for (const skill of catalog.skills || []) {
  const repo = repoFromSkill(skill);
  const stars = await starsFor(repo);
  if (stars != null) skill.sourceStars = stars;
}

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log(
  `enrich-stars: ${cache.size} repo(s), ${catalog.skills.length} skills atualizados`,
);
