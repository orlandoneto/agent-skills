/**
 * Descoberta incremental de repos com Agent Skills (GitHub Search).
 * Estado em JSON no Git — sem Postgres/Redis (futuro, se volume exigir).
 */

export const DISCOVERY_STATE_VERSION = 1;

export const DEFAULT_SEARCH_QUERIES = [
  { id: "code-skill-md-skills-path", kind: "code", q: "filename:SKILL.md path:skills" },
  { id: "code-skill-md", kind: "code", q: "filename:SKILL.md" },
  { id: "repo-topic-agent-skills", kind: "repositories", q: "topic:agent-skills" },
  { id: "repo-topic-claude-skills", kind: "repositories", q: "topic:claude-skills" },
  { id: "repo-name-agent-skills", kind: "repositories", q: "agent-skills in:name" },
];

export function emptyDiscoveryState() {
  return {
    version: DISCOVERY_STATE_VERSION,
    updatedAt: null,
    note: "Cache de descoberta (repos/queries). Postgres/Redis = futuro se volume exigir.",
    queries: {},
    repos: {},
  };
}

export function normalizeRepoFullName(name) {
  return String(name || "")
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export function isOwnMirror(repo, ownRepo = "orlandoneto/agent-skills") {
  return normalizeRepoFullName(repo) === normalizeRepoFullName(ownRepo);
}

/** Repos já na allowlist estática da policy. */
export function policyRepoSet(policy) {
  const set = new Set();
  for (const s of policy?.crawler?.sourcesAllowlist || []) {
    if (s.type === "github-repo-skills" && s.repo) {
      set.add(normalizeRepoFullName(s.repo));
    }
  }
  return set;
}

/**
 * Decide se deve (re)inspecionar um repo hoje.
 * @returns {{ inspect: boolean, reason: string }}
 */
export function shouldInspectRepo(entry, { now = new Date(), recheckDays = 7 } = {}) {
  if (!entry) return { inspect: true, reason: "novo" };
  const status = entry.status || "";
  if (status === "rejected" || status === "skipped") {
    return { inspect: false, reason: `status=${status}` };
  }
  if (!entry.lastCheckedAt) return { inspect: true, reason: "nunca checado" };
  const last = Date.parse(entry.lastCheckedAt);
  if (Number.isNaN(last)) return { inspect: true, reason: "lastChecked inválido" };
  const ageMs = now.getTime() - last;
  const windowMs = recheckDays * 24 * 60 * 60 * 1000;
  if (status === "exhausted" || status === "dynamic" || status === "allowlisted") {
    if (ageMs < windowMs) {
      return { inspect: false, reason: `recheck em ${recheckDays}d` };
    }
    return { inspect: true, reason: "recheck periódico" };
  }
  if (status === "candidate") return { inspect: true, reason: "candidato" };
  return { inspect: true, reason: "default" };
}

export function mapSpdxToAllowlist(spdx, allowList) {
  if (!spdx) return null;
  const raw = String(spdx).trim();
  const hit = (allowList || []).find((l) => l.toLowerCase() === raw.toLowerCase());
  if (hit) return hit;
  // aliases comuns
  if (/^apache-2\.0$/i.test(raw)) {
    return (allowList || []).find((l) => /apache/i.test(l)) || null;
  }
  return null;
}

/**
 * Avança página de uma query (1-based). Se done, não avança.
 */
export function nextQueryPage(queryState, { maxPages = 5 } = {}) {
  const lastPage = Number(queryState?.lastPage || 0);
  if (queryState?.done) return { page: null, done: true };
  const page = lastPage + 1;
  if (page > maxPages) return { page: null, done: true };
  return { page, done: false };
}

export function buildDynamicSource({ repo, path: skillsPath, defaultLicense, discoveredAt }) {
  const full = normalizeRepoFullName(repo);
  const id = `discovered-${full.replace(/\//g, "-")}`;
  return {
    id,
    type: "github-repo-skills",
    repo: full,
    path: skillsPath || "skills",
    defaultLicense: defaultLicense || "MIT",
    enabled: true,
    discoveredAt: discoveredAt || new Date().toISOString().slice(0, 10),
  };
}

/**
 * Mescla allowlist estática + dynamic-sources (descobertos).
 * Dedup por repo; policy vence.
 */
export function mergeCrawlSources(policySources, dynamicSources) {
  const out = [];
  const seen = new Set();
  for (const s of policySources || []) {
    out.push(s);
    if (s.repo) seen.add(normalizeRepoFullName(s.repo));
  }
  for (const s of dynamicSources || []) {
    if (!s?.enabled) continue;
    if (s.type !== "github-repo-skills" || !s.repo) continue;
    const key = normalizeRepoFullName(s.repo);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
