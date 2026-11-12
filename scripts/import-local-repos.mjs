/**
 * Importa skills de repos clonados em staging/tmp-repos/ (sem Contents API).
 * Gera/atualiza staging/candidates-YYYY-MM-DD.json para publish-safe.
 *
 * Uso:
 *   node scripts/import-local-repos.mjs
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
const staging = path.join(root, "staging");
const tmpRoot = path.join(staging, "tmp-repos");
mkdirSync(tmpRoot, { recursive: true });

const day = new Date().toISOString().slice(0, 10);
const existingFp = collectFingerprints(root, policy);

const REPOS = [
  {
    id: "coreyhaines-marketingskills",
    repo: "coreyhaines31/marketingskills",
    idNamespace: "ms",
    defaultLicense: "MIT",
    sparse: ["skills"],
  },
  {
    id: "agricidaniel-claude-seo",
    repo: "AgriciDaniel/claude-seo",
    idNamespace: "claude-seo",
    defaultLicense: "MIT",
    sparse: ["skills"],
  },
  {
    id: "kostja94-marketing-skills",
    repo: "kostja94/marketing-skills",
    idNamespace: "kostja",
    defaultLicense: "MIT",
    sparse: ["skills"],
  },
  {
    id: "aaron-marketing",
    repo: "aaron-he-zhu/aaron-marketing-skills",
    idNamespace: "aaron",
    defaultLicense: "Apache-2.0",
    sparse: ["seo-geo", "narrative", "social", "email"],
  },
];

const SKIP = new Set([
  "scripts",
  "references",
  "assets",
  "docs",
  "tests",
  "node_modules",
  ".git",
]);

function cloneRepo(spec) {
  const dest = path.join(tmpRoot, spec.repo.replace("/", "__"));
  if (existsSync(path.join(dest, ".git"))) {
    console.log(`já clonado: ${spec.repo}`);
    return dest;
  }
  mkdirSync(dest, { recursive: true });
  console.log(`clone ${spec.repo}…`);
  const r = spawnSync(
    "git",
    [
      "clone",
      "--depth",
      "1",
      "--filter=blob:none",
      "--sparse",
      `https://github.com/${spec.repo}.git`,
      dest,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(`clone falhou ${spec.repo}: ${r.stderr || r.stdout}`);
  }
  const sparse = spawnSync(
    "git",
    ["sparse-checkout", "set", ...spec.sparse],
    { cwd: dest, encoding: "utf8" },
  );
  if (sparse.status !== 0) {
    console.warn(`sparse-checkout warn: ${sparse.stderr || sparse.stdout}`);
  }
  return dest;
}

function walkSkillDirs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  if (entries.some((e) => /^skill\.md$/i.test(e))) {
    acc.push(dir);
    return acc;
  }
  for (const name of entries) {
    if (SKIP.has(name.toLowerCase())) continue;
    const full = path.join(dir, name);
    try {
      if (statSync(full).isDirectory()) walkSkillDirs(full, acc);
    } catch {
      /* ignore */
    }
  }
  return acc;
}

function namespacedId(raw, ns) {
  const base = normalizeName(raw);
  const n = normalizeName(ns);
  if (!base) return "";
  if (base.startsWith(`${n}-`)) return base;
  return normalizeName(`${n}-${base}`);
}

function normalizeLicense(raw, fallback) {
  const lic = String(raw || "").trim();
  if (!lic) return fallback || "";
  if (/complete terms|see license|license\.txt/i.test(lic)) return fallback || lic;
  return lic;
}

const candidates = [];
const rejected = [];
const seenFp = new Set();

for (const spec of REPOS) {
  let dest;
  try {
    dest = cloneRepo(spec);
  } catch (err) {
    console.error(err.message);
    continue;
  }

  const roots = spec.sparse.map((p) => path.join(dest, p));
  const folders = [];
  for (const r of roots) walkSkillDirs(r, folders);
  console.log(`${spec.repo}: ${folders.length} SKILL.md`);

  for (const folder of folders) {
    if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
    const skillFile = path.join(folder, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const rel = path.relative(dest, folder).replace(/\\/g, "/");
    const folderName = path.basename(folder);
    const id = namespacedId(folderName, spec.idNamespace);
    const hasScripts = existsSync(path.join(folder, "scripts"));
    const sourceUrl = `https://github.com/${spec.repo}/tree/HEAD/${rel}`;
    const base = { id, sourceUrl, sourceId: spec.id, repo: spec.repo };

    if (hasScripts) {
      rejected.push({ ...base, reason: "pasta scripts/" });
      continue;
    }

    try {
      const md = readFileSync(skillFile, "utf8");
      const { meta, body } = parseFrontmatter(md);
      const name = meta.name || folderName;
      const desc = meta.description || "";
      const lic = normalizeLicense(meta.license, spec.defaultLicense);

      if (!desc || desc.length < policy.quality.minDescriptionLength) {
        rejected.push({ ...base, reason: "description curta" });
        continue;
      }
      const licenseOk =
        Boolean(lic) &&
        policy.licenses.allow.some((l) => l.toLowerCase() === lic.toLowerCase());
      if (!licenseOk) {
        rejected.push({ ...base, license: lic, reason: "licença" });
        continue;
      }

      const fp = fingerprint({ name, body });
      if (existingFp.has(fp) || seenFp.has(fp)) {
        rejected.push({ ...base, reason: "duplicata fingerprint" });
        continue;
      }
      const score = scoreSkill({
        meta: { name, description: desc },
        body,
        hasScripts: false,
        licenseOk: true,
      });
      if (score < policy.quality.minScoreToAutoPropose) {
        rejected.push({ ...base, reason: `score ${score}` });
        continue;
      }

      seenFp.add(fp);
      // file:// rawUrl — publish-safe precisa HTTP. Gravamos cópia temp e usamos raw github
      const rawUrl = `https://raw.githubusercontent.com/${spec.repo}/HEAD/${rel}/SKILL.md`;
      candidates.push({
        id,
        name: normalizeName(name),
        description: desc,
        license: lic,
        sourceUrl,
        rawUrl,
        sourceId: spec.id,
        fingerprint: fp,
        score,
        hasScriptsHint: false,
        requiresManualReview: false,
        status: "staging",
        fetchedAt: new Date().toISOString(),
        localPath: skillFile,
      });
    } catch (err) {
      rejected.push({ ...base, reason: err.message });
    }
  }
}

// Merge com candidates do dia se existir (não apagar outros)
const outFile = path.join(staging, `candidates-${day}.json`);
let prev = { candidates: [], rejected: [] };
if (existsSync(outFile)) {
  try {
    prev = JSON.parse(readFileSync(outFile, "utf8"));
  } catch {
    /* ignore */
  }
}
const byFp = new Map();
for (const c of [...(prev.candidates || []), ...candidates]) {
  if (!byFp.has(c.fingerprint)) byFp.set(c.fingerprint, c);
}
const merged = {
  date: day,
  policyVersion: policy.version,
  maxCandidatesPerDay: policy.crawler.maxCandidatesPerDay,
  note: "import-local-repos + crawl. Marketing/SEO packages.",
  candidates: [...byFp.values()].sort((a, b) => (b.score || 0) - (a.score || 0)),
  rejected: [...(prev.rejected || []), ...rejected],
};

writeFileSync(outFile, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(
  `OK: ${candidates.length} novos candidatos deste import; total merged ${merged.candidates.length} → ${path.relative(root, outFile)}`,
);
console.log(`rejeitados neste import: ${rejected.length}`);
