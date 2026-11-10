/**
 * Crawler = radar. Escreve staging apenas. Não publica.
 * Respeita policy: quota, allowlist, User-Agent, sem espelho em massa.
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const stagingDir = path.join(root, "staging");
mkdirSync(stagingDir, { recursive: true });

const day = new Date().toISOString().slice(0, 10);
const outFile = path.join(stagingDir, `candidates-${day}.json`);
const existingFp = collectFingerprints(root, policy);

const candidates = [];
const rejected = [];

function pushReject(item, reason) {
  rejected.push({ ...item, reason });
}

async function fetchText(url) {
  const headers = {
    "User-Agent": policy.crawler.userAgent,
    Accept: "application/vnd.github+json, text/plain, */*",
  };
  // Token opcional: reduz chance de rate limit (ToS: 1 pass/fonte/dia)
  if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}`;
  }

  // Em alguns Windows corporativos o Node falha TLS (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
  // CI Linux (Actions) usa fetch normal. Fallback: PowerShell Invoke-RestMethod.
  try {
    const res = await fetch(url, { headers });
    if (res.status === 403 || res.status === 429) {
      throw new Error(`rate-limit/ToS risk HTTP ${res.status} em ${url}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.text();
  } catch (err) {
    if (process.platform !== "win32") throw err;
    const { spawnSync } = await import("node:child_process");
    const auth = headers.Authorization
      ? `$h['Authorization']='${headers.Authorization}';`
      : "";
    const ps = `
      $h=@{'User-Agent'='${policy.crawler.userAgent}';'Accept'='application/vnd.github+json, text/plain, */*'};
      ${auth}
      (Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -Headers $h -UseBasicParsing).Content
    `;
    const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (r.status !== 0) {
      throw new Error(err.message + " | ps: " + (r.stderr || r.stdout || ""));
    }
    return r.stdout;
  }
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
    });
  }
}

async function crawlGithubRepoSkills(source) {
  // Lista via API de conteúdos — 1 request; não espelha o repo inteiro em disco.
  const api = `https://api.github.com/repos/${source.repo}/contents/${source.path || "skills"}`;
  let listing;
  try {
    listing = JSON.parse(await fetchText(api));
  } catch (err) {
    console.warn(`fonte ${source.id} pulada: ${err.message}`);
    return;
  }
  if (!Array.isArray(listing)) return;

  for (const entry of listing) {
    if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
    if (entry.type !== "dir") continue;
    const id = normalizeName(entry.name);
    const rawUrl = `https://raw.githubusercontent.com/${source.repo}/HEAD/${source.path}/${entry.name}/SKILL.md`;

    let hasScriptsFolder = false;
    try {
      const childApi = `https://api.github.com/repos/${source.repo}/contents/${source.path}/${entry.name}`;
      const children = JSON.parse(await fetchText(childApi));
      if (Array.isArray(children)) {
        hasScriptsFolder = children.some((c) => c.name === "scripts");
      }
    } catch {
      // se falhar o listing do filho, segue com heurística do SKILL.md
    }

    // Repo SPDX quando o frontmatter não declara license
    const defaultLicense =
      source.repo === "anthropics/skills"
        ? "Apache-2.0"
        : source.repo === "addyosmani/agent-skills"
          ? "MIT"
          : null;

    await ingestRemoteSkill({
      id,
      sourceUrl: entry.html_url || `https://github.com/${source.repo}/tree/HEAD/${source.path}/${entry.name}`,
      rawUrl,
      license: defaultLicense,
      sourceId: source.id,
      repo: source.repo,
      hasScriptsFolder,
    });
  }
}

function normalizeLicense(raw, fallback) {
  const lic = String(raw || "").trim();
  if (!lic) return fallback || "";
  if (/complete terms|see license|license\.txt/i.test(lic)) return fallback || lic;
  return lic;
}

async function ingestRemoteSkill({
  id,
  sourceUrl,
  rawUrl,
  license,
  sourceId,
  repo,
  hasScriptsFolder = false,
}) {
  const base = { id, sourceUrl, rawUrl, sourceId, repo: repo || null };
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
      id: normalizeName(name),
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

for (const source of policy.crawler.sourcesAllowlist) {
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
