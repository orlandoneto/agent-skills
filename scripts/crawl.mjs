/**
 * Crawler = radar. Escreve staging apenas. Não publica.
 * Respeita policy: quota, allowlist (+ dynamic-sources), User-Agent.
 * Suporta pastas aninhadas (nested) e idNamespace para evitar colisão de ids.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectFingerprints,
  loadPolicy,
  normalizeName,
  parseFrontmatter,
  fingerprint,
  scoreSkill,
} from "./lib/gates.mjs";
import { mergeCrawlSources } from "./lib/discovery.mjs";
import { fetchText as fetchTextLib } from "./lib/fetch-text.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const stagingDir = path.join(root, "staging");
mkdirSync(stagingDir, { recursive: true });

const SKIP_DIR_NAMES = new Set([
  ".git",
  ".github",
  ".claude-plugin",
  ".devcontainer",
  ".githooks",
  "node_modules",
  "scripts",
  "references",
  "assets",
  "docs",
  "tests",
  "test",
  "evals",
  "hooks",
  "agents",
  "schema",
  "screenshots",
  "data",
  "extensions",
  "badges",
  "memory",
  "protocol",
  "commands",
  "templates",
]);

function loadDynamicSources() {
  const file = path.join(stagingDir, "dynamic-sources.json");
  if (!existsSync(file)) return [];
  try {
    const doc = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(doc.sources) ? doc.sources : [];
  } catch {
    return [];
  }
}

const day = new Date().toISOString().slice(0, 10);
const outFile = path.join(stagingDir, `candidates-${day}.json`);
const existingFp = collectFingerprints(root, policy);

const candidates = [];
const rejected = [];

function pushReject(item, reason) {
  rejected.push({ ...item, reason });
}

async function fetchText(url) {
  return fetchTextLib(url, { userAgent: policy.crawler.userAgent });
}

async function listDir(repo, dirPath) {
  const api = dirPath
    ? `https://api.github.com/repos/${repo}/contents/${dirPath}`
    : `https://api.github.com/repos/${repo}/contents`;
  const listing = JSON.parse(await fetchText(api));
  return Array.isArray(listing) ? listing : [];
}

/**
 * Encontra pastas que contêm SKILL.md (suporta nested).
 */
async function findSkillFolders(repo, basePath, { nested = false, maxDepth = 2 } = {}) {
  const out = [];

  async function walk(dirPath, depth) {
    if (candidates.length + out.length >= policy.crawler.maxCandidatesPerDay) return;
    let listing;
    try {
      listing = await listDir(repo, dirPath);
    } catch (err) {
      console.warn(`list ${repo}/${dirPath}: ${err.message}`);
      return;
    }

    const hasSkillMd = listing.some(
      (e) => e.type === "file" && /^skill\.md$/i.test(e.name),
    );
    if (hasSkillMd && dirPath) {
      const parts = dirPath.split("/");
      const name = parts[parts.length - 1];
      out.push({
        name,
        path: dirPath,
        hasScriptsFolder: listing.some((e) => e.name === "scripts" && e.type === "dir"),
        html_url: `https://github.com/${repo}/tree/HEAD/${dirPath}`,
      });
      return; // pasta skill — não desce mais
    }

    if (!nested && depth > 0) return;
    if (depth >= maxDepth) return;

    for (const entry of listing) {
      if (entry.type !== "dir") continue;
      if (SKIP_DIR_NAMES.has(entry.name.toLowerCase())) continue;
      const child = dirPath ? `${dirPath}/${entry.name}` : entry.name;
      await walk(child, depth + 1);
    }
  }

  await walk(basePath || "", 0);
  return out;
}

async function crawlLocalManifest(source) {
  const file = path.join(root, source.path);
  if (!existsSync(file)) {
    console.warn(`seed ausente: ${source.path}`);
    return;
  }
  const seed = JSON.parse(readFileSync(file, "utf8"));
  for (const item of seed.skills || []) {
    if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
    await ingestRemoteSkill({
      id: item.id,
      sourceUrl: item.sourceUrl,
      rawUrl: item.rawUrl,
      license: item.license,
      sourceId: source.id,
      idNamespace: source.idNamespace,
    });
  }
}

async function crawlGithubRepoSkills(source) {
  const basePath = source.path || "skills";
  const nested = Boolean(source.nested);
  const maxDepth = Number(source.maxDepth ?? (nested ? 3 : 1));

  let folders;
  try {
    folders = await findSkillFolders(source.repo, basePath, { nested, maxDepth });
  } catch (err) {
    console.warn(`fonte ${source.id} pulada: ${err.message}`);
    return;
  }

  console.log(`fonte ${source.id}: ${folders.length} pasta(s) com SKILL.md`);

  for (const folder of folders) {
    if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
    const rawUrl = `https://raw.githubusercontent.com/${source.repo}/HEAD/${folder.path}/SKILL.md`;
    await ingestRemoteSkill({
      id: folder.name,
      sourceUrl: folder.html_url,
      rawUrl,
      license: source.defaultLicense || null,
      sourceId: source.id,
      repo: source.repo,
      hasScriptsFolder: folder.hasScriptsFolder,
      idNamespace: source.idNamespace,
    });
  }
}

function normalizeLicense(raw, fallback) {
  const lic = String(raw || "").trim();
  if (!lic) return fallback || "";
  if (/complete terms|see license|license\.txt/i.test(lic)) return fallback || lic;
  return lic;
}

function namespacedId(rawId, idNamespace) {
  const base = normalizeName(rawId);
  if (!base) return "";
  if (!idNamespace) return base;
  const ns = normalizeName(idNamespace);
  if (base.startsWith(`${ns}-`)) return base;
  return normalizeName(`${ns}-${base}`);
}

async function ingestRemoteSkill({
  id,
  sourceUrl,
  rawUrl,
  license,
  sourceId,
  repo,
  hasScriptsFolder = false,
  idNamespace = null,
}) {
  const catalogId = namespacedId(id, idNamespace);
  const base = { id: catalogId, sourceUrl, rawUrl, sourceId, repo: repo || null };
  try {
    const md = await fetchText(rawUrl);
    const { meta, body } = parseFrontmatter(md);
    const name = meta.name || id;
    const desc = meta.description || "";
    const lic = normalizeLicense(license || meta.license, license);

    if (!desc || desc.length < policy.quality.minDescriptionLength) {
      pushReject(base, "description curta / ausente (anti-lixo)");
      return;
    }

    const licenseOk =
      Boolean(lic) &&
      policy.licenses.allow.some((l) => l.toLowerCase() === lic.toLowerCase());
    if (!licenseOk) {
      pushReject(
        { ...base, license: lic || "UNKNOWN" },
        "licença ausente ou fora da allowlist → quarantine",
      );
      return;
    }

    const hasScriptsHint = hasScriptsFolder || /(?:^|\n)\s*scripts\//im.test(md);
    if (hasScriptsFolder) {
      pushReject(base, "pasta scripts/ → só review manual (não auto-staging)");
      return;
    }

    const fp = fingerprint({ name, body });
    if (policy.dedupe.rejectIfSameFingerprintExists && existingFp.has(fp)) {
      pushReject(base, `duplicata de ${JSON.stringify(existingFp.get(fp))}`);
      return;
    }
    if (candidates.some((c) => c.fingerprint === fp)) {
      pushReject(base, "duplicata dentro do batch do dia");
      return;
    }

    const score = scoreSkill({
      meta: { name, description: desc },
      body,
      hasScripts: hasScriptsHint,
      licenseOk,
    });

    if (score < policy.quality.minScoreToAutoPropose) {
      pushReject(base, `score ${score} < ${policy.quality.minScoreToAutoPropose}`);
      return;
    }

    candidates.push({
      id: catalogId,
      name: normalizeName(name),
      description: desc,
      license: lic,
      sourceUrl,
      rawUrl,
      sourceId,
      fingerprint: fp,
      score,
      hasScriptsHint,
      requiresManualReview: hasScriptsHint,
      status: "staging",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    pushReject(base, err.message);
  }
}

const crawlSources = mergeCrawlSources(
  policy.crawler.sourcesAllowlist,
  loadDynamicSources(),
);
console.log(
  `fontes: ${crawlSources.length} (policy + dynamic-sources descobertos)`,
);

for (const source of crawlSources) {
  if (!source.enabled) continue;
  if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
  if (source.type === "local-manifest") await crawlLocalManifest(source);
  else if (source.type === "github-repo-skills") await crawlGithubRepoSkills(source);
}

const payload = {
  date: day,
  policyVersion: policy.version,
  maxCandidatesPerDay: policy.crawler.maxCandidatesPerDay,
  note: "Candidatos para publish-safe (Action diária). Scripts/licença ruim → rejected. Ver docs/QUALITY_GATES.md",
  candidates,
  rejected,
};

writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(
  `staging: ${candidates.length} candidatos, ${rejected.length} rejeitados → ${path.relative(root, outFile)}`,
);
console.log("Próximo: npm run publish-safe → catalog.json + Git + ZIP Release → Ontoom /skills");
if (candidates.length === 0) {
  console.log("Nada novo para publish-safe (ok).");
}
