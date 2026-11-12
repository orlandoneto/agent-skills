/**
 * Fase A — descoberta inteligente (GitHub Search only; sem Google).
 * Atualiza staging/discovery-state.json + staging/dynamic-sources.json.
 * Não publica skills — só alimenta fontes para o crawl.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPolicy } from "./lib/gates.mjs";
import {
  DEFAULT_SEARCH_QUERIES,
  buildDynamicSource,
  emptyDiscoveryState,
  isOwnMirror,
  mapSpdxToAllowlist,
  nextQueryPage,
  normalizeRepoFullName,
  policyRepoSet,
  shouldInspectRepo,
} from "./lib/discovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const stagingDir = path.join(root, "staging");
mkdirSync(stagingDir, { recursive: true });

const day = new Date().toISOString().slice(0, 10);
const statePath = path.join(stagingDir, "discovery-state.json");
const dynamicPath = path.join(stagingDir, "dynamic-sources.json");
const reportPath = path.join(stagingDir, `discovered-repos-${day}.json`);

const cfg = policy.crawler?.discovery || {};
const maxNewRepos = Number(cfg.maxNewReposPerDay ?? 8);
const maxPagesPerQuery = Number(cfg.maxPagesPerQueryPerDay ?? 2);
const recheckDays = Number(cfg.recheckDays ?? 7);
const ownRepo = cfg.ownRepo || "orlandoneto/agent-skills";
const enabled = cfg.enabled !== false;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

function loadState() {
  if (!existsSync(statePath)) return emptyDiscoveryState();
  try {
    const raw = JSON.parse(readFileSync(statePath, "utf8"));
    return {
      ...emptyDiscoveryState(),
      ...raw,
      queries: raw.queries || {},
      repos: raw.repos || {},
    };
  } catch {
    return emptyDiscoveryState();
  }
}

function loadDynamic() {
  if (!existsSync(dynamicPath)) {
    return { updatedAt: null, sources: [] };
  }
  try {
    return JSON.parse(readFileSync(dynamicPath, "utf8"));
  } catch {
    return { updatedAt: null, sources: [] };
  }
}

async function ghJson(url) {
  const headers = {
    "User-Agent": policy.crawler.userAgent,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (res.status === 403 || res.status === 429) {
    const body = await res.text().catch(() => "");
    throw new Error(`rate-limit HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url} ${body.slice(0, 120)}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureRepoEntry(state, fullName) {
  const key = normalizeRepoFullName(fullName);
  if (!state.repos[key]) {
    state.repos[key] = {
      firstSeenAt: new Date().toISOString(),
      lastCheckedAt: null,
      status: "candidate",
      reason: null,
      path: "skills",
      defaultLicense: null,
      skillsPathOk: null,
    };
  }
  return state.repos[key];
}

async function inspectRepo(fullName) {
  const repo = normalizeRepoFullName(fullName);
  const meta = await ghJson(`https://api.github.com/repos/${repo}`);
  let license =
    mapSpdxToAllowlist(meta.license?.spdx_id, policy.licenses.allow) ||
    mapSpdxToAllowlist(meta.license?.key, policy.licenses.allow);

  // Fallback: LICENSE file name heuristics only via API license endpoint
  if (!license && meta.license?.spdx_id) {
    license = null;
  }

  let skillsPath = "skills";
  let skillsPathOk = false;
  try {
    const listing = await ghJson(
      `https://api.github.com/repos/${repo}/contents/skills`,
    );
    if (Array.isArray(listing) && listing.some((e) => e.type === "dir")) {
      skillsPathOk = true;
      skillsPath = "skills";
    }
  } catch {
    // try root-level single skills pattern — still useful as seed later
    skillsPathOk = false;
  }

  return {
    repo,
    defaultLicense: license,
    skillsPath,
    skillsPathOk,
    stars: meta.stargazers_count ?? 0,
    pushedAt: meta.pushed_at || null,
    archived: Boolean(meta.archived),
    private: Boolean(meta.private),
  };
}

async function collectReposFromSearches(state) {
  const found = new Set();
  const queries = cfg.queries?.length
    ? cfg.queries
    : DEFAULT_SEARCH_QUERIES;

  for (const query of queries) {
    const qState = state.queries[query.id] || {
      lastPage: 0,
      lastRunAt: null,
      done: false,
    };
    let pagesToday = 0;
    while (pagesToday < maxPagesPerQuery) {
      const { page, done } = nextQueryPage(qState, {
        maxPages: Number(cfg.maxPagesTotalPerQuery ?? 10),
      });
      if (done || page == null) {
        qState.done = true;
        break;
      }

      const encoded = encodeURIComponent(query.q);
      const url =
        query.kind === "repositories"
          ? `https://api.github.com/search/repositories?q=${encoded}&per_page=30&page=${page}`
          : `https://api.github.com/search/code?q=${encoded}&per_page=30&page=${page}`;

      let data;
      try {
        if (!token && query.kind === "code") {
          console.warn(
            `skip code search ${query.id}: GITHUB_TOKEN obrigatório para code search`,
          );
          break;
        }
        data = await ghJson(url);
      } catch (err) {
        console.warn(`search ${query.id} p${page}: ${err.message}`);
        break;
      }

      const items = data.items || [];
      for (const item of items) {
        const full =
          query.kind === "repositories"
            ? item.full_name
            : item.repository?.full_name;
        if (full) found.add(normalizeRepoFullName(full));
      }

      qState.lastPage = page;
      qState.lastRunAt = new Date().toISOString();
      pagesToday += 1;

      // Sem mais páginas
      if (items.length < 30 || (data.total_count && page * 30 >= data.total_count)) {
        qState.done = true;
        break;
      }
      // Code search: pausa gentil (10 req/min)
      await sleep(query.kind === "code" ? 6500 : 1200);
    }
    state.queries[query.id] = qState;
  }
  return found;
}

async function main() {
  if (!enabled) {
    console.log("discovery.enabled=false — skip");
    return;
  }

  if (!token) {
    console.warn(
      "Sem GITHUB_TOKEN: discovery limitada (repo search pública frágil; code search off).",
    );
  }

  const state = loadState();
  const policyRepos = policyRepoSet(policy);
  const dynamicDoc = loadDynamic();
  const dynamicByRepo = new Map(
    (dynamicDoc.sources || []).map((s) => [normalizeRepoFullName(s.repo), s]),
  );

  const report = {
    date: day,
    newDynamic: [],
    inspected: [],
    skipped: [],
    rejected: [],
    note: "Descoberta GitHub-only. Google/SERP = fora. Banco grande = futuro.",
  };

  let found;
  try {
    found = await collectReposFromSearches(state);
  } catch (err) {
    console.error("busca falhou:", err.message);
    found = new Set();
  }

  // Sempre re-considerar repos candidatos no state
  for (const key of Object.keys(state.repos)) {
    found.add(key);
  }

  let added = 0;
  for (const full of [...found].sort()) {
    if (added >= maxNewRepos) break;
    if (isOwnMirror(full, ownRepo)) {
      report.skipped.push({ repo: full, reason: "espelho próprio" });
      continue;
    }
    if (policyRepos.has(full)) {
      const e = ensureRepoEntry(state, full);
      e.status = "allowlisted";
      e.reason = "já na policy";
      e.lastCheckedAt = new Date().toISOString();
      report.skipped.push({ repo: full, reason: "já na policy allowlist" });
      continue;
    }

    const entry = ensureRepoEntry(state, full);
    const { inspect, reason } = shouldInspectRepo(entry, { recheckDays });
    if (!inspect) {
      report.skipped.push({ repo: full, reason });
      continue;
    }

    try {
      await sleep(400);
      const info = await inspectRepo(full);
      entry.lastCheckedAt = new Date().toISOString();
      entry.path = info.skillsPath;
      entry.defaultLicense = info.defaultLicense;
      entry.skillsPathOk = info.skillsPathOk;
      entry.stars = info.stars;
      entry.pushedAt = info.pushedAt;

      report.inspected.push({
        repo: full,
        skillsPathOk: info.skillsPathOk,
        license: info.defaultLicense,
        stars: info.stars,
      });

      if (info.archived || info.private) {
        entry.status = "rejected";
        entry.reason = info.private ? "privado" : "arquivado";
        report.rejected.push({ repo: full, reason: entry.reason });
        continue;
      }
      if (!info.skillsPathOk) {
        entry.status = "rejected";
        entry.reason = "sem pasta skills/ com subdirs";
        report.rejected.push({ repo: full, reason: entry.reason });
        continue;
      }
      if (!info.defaultLicense) {
        entry.status = "rejected";
        entry.reason = "licença SPDX fora da allowlist / ausente";
        report.rejected.push({ repo: full, reason: entry.reason });
        continue;
      }

      const src = buildDynamicSource({
        repo: full,
        path: info.skillsPath,
        defaultLicense: info.defaultLicense,
        discoveredAt: day,
      });
      dynamicByRepo.set(full, src);
      entry.status = "dynamic";
      entry.reason = "adicionado a dynamic-sources";
      report.newDynamic.push(src);
      added += 1;
    } catch (err) {
      entry.lastCheckedAt = new Date().toISOString();
      entry.status = "candidate";
      entry.reason = err.message;
      report.skipped.push({ repo: full, reason: err.message });
    }
  }

  const sources = [...dynamicByRepo.values()].sort((a, b) =>
    a.repo.localeCompare(b.repo),
  );
  const dynamicOut = {
    updatedAt: new Date().toISOString(),
    policyVersion: policy.version,
    note: "Fontes descobertas automaticamente. Crawl mescla com policy.sourcesAllowlist. Postgres = futuro.",
    sources,
  };

  state.updatedAt = new Date().toISOString();
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  writeFileSync(dynamicPath, JSON.stringify(dynamicOut, null, 2) + "\n", "utf8");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(
    `discover: +${report.newDynamic.length} fonte(s) dinâmica(s), ` +
      `${report.inspected.length} inspecionada(s), ` +
      `${report.skipped.length} skip, ${report.rejected.length} rejeitada(s)`,
  );
  console.log(`state → ${path.relative(root, statePath)}`);
  console.log(`dynamic → ${path.relative(root, dynamicPath)}`);
  console.log(`report → ${path.relative(root, reportPath)}`);
}

main().catch((err) => {
  console.error("discover-repos:", err.message);
  process.exit(1);
});
