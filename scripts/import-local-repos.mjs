/**
 * Importa skills de repos clonados em staging/tmp-repos/ (sem Contents API).
 * Gera/atualiza staging/candidates-YYYY-MM-DD.json para publish-safe.
 *
 * Uso:
 *   node scripts/import-local-repos.mjs
 *   IMPORT_SET=video|new|marketing|all node scripts/import-local-repos.mjs
 *
 * Default: REPOS_VIDEO
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

/** Só estes por padrão; IMPORT_ALL=1 inclui o pacote marketing já importado. */
const REPOS_NEW = [
  {
    id: "notque-vexjoy-agent",
    repo: "notque/vexjoy-agent",
    idNamespace: "notque",
    defaultLicense: "MIT",
    // content = blog/SEO-ish; business + research também úteis
    sparse: ["skills/content", "skills/business", "skills/research"],
  },
  {
    id: "davila7-claude-code-templates",
    repo: "davila7/claude-code-templates",
    idNamespace: "aitmpl",
    defaultLicense: "MIT",
    // Só marketing/SEO do registry (não o monorepo inteiro)
    sparse: [
      "cli-tool/components/skills/business-marketing",
      "cli-tool/components/skills/development",
    ],
  },
  {
    id: "ckorhonen-claude-skills",
    repo: "ckorhonen/claude-skills",
    idNamespace: "ck",
    defaultLicense: "MIT",
    sparse: ["skills"],
  },
];

const REPOS_MARKETING = [
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

/** Video / motion production sources (sparse clone; no Contents API spam). */
const REPOS_VIDEO = [
  {
    id: "remotion-dev-skills",
    repo: "remotion-dev/skills",
    idNamespace: "remotion",
    // No LICENSE file in repo (GitHub SPDX null; issue #31). Task brief: MIT for SKILL.md republish.
    defaultLicense: "MIT",
    sparse: ["skills"],
  },
  {
    id: "bomx-openvideo",
    repo: "Bomx/OpenVideo",
    idNamespace: "bomx",
    defaultLicense: "MIT",
    // Root SKILL.md — also alias Bomx/super-video-maker-skill.
    // Sparse tools/scripts so SAFE gate can detect executable helpers.
    rootSkill: true,
    sparse: ["SKILL.md", "tools", "scripts"],
    rejectExecutableDirs: ["scripts", "tools"],
  },
  {
    id: "calesthio-openmontage",
    // calesthio/OpenMontage redirects to OpenMontageInc/OpenMontage (AGPL-3.0)
    repo: "calesthio/OpenMontage",
    idNamespace: "openmontage",
    defaultLicense: "AGPL-3.0",
    sparse: [".agents/skills"],
  },
];

const importSet = String(process.env.IMPORT_SET || "video").toLowerCase();
const REPOS =
  process.env.IMPORT_ALL === "1" || importSet === "all"
    ? [...REPOS_MARKETING, ...REPOS_NEW, ...REPOS_VIDEO]
    : importSet === "new"
      ? REPOS_NEW
      : importSet === "marketing"
        ? REPOS_MARKETING
        : REPOS_VIDEO;

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
  const sparsePaths = (spec.sparse || []).filter((p) => p && p !== ".");
  if (sparsePaths.length > 0) {
    // Prefer cone mode dirs; for files use --no-cone
    const sparse = spawnSync(
      "git",
      ["sparse-checkout", "set", "--no-cone", ...sparsePaths],
      { cwd: dest, encoding: "utf8" },
    );
    if (sparse.status !== 0) {
      console.warn(`sparse-checkout warn: ${sparse.stderr || sparse.stdout}`);
    }
  }
  return dest;
}

function padDescription(desc, folderName, minLen) {
  let d = String(desc || "").trim();
  if (d.length >= minLen) return d;
  const hint = folderName.replace(/-/g, " ");
  d = `${d} Agent skill for ${hint} video production workflows with AI coding agents.`.trim();
  return d;
}

function enrichSkillMd(md, { name, description, license }) {
  const { meta, body } = parseFrontmatter(md);
  const nextName = meta.name || name;
  const nextDesc = description || meta.description || "";
  const nextLic = meta.license || license || "MIT";
  return `---
name: ${nextName}
description: >-
  ${nextDesc}
license: ${nextLic}
---
${body.startsWith("\n") ? body : `\n${body}`}`;
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

  const folders = [];
  if (spec.rootSkill) {
    if (existsSync(path.join(dest, "SKILL.md"))) folders.push(dest);
  } else {
    const roots = (spec.sparse || ["skills"]).map((p) =>
      p === "." ? dest : path.join(dest, p),
    );
    for (const r of roots) walkSkillDirs(r, folders);
  }
  console.log(`${spec.repo}: ${folders.length} SKILL.md`);

  const rejectDirs = new Set(
    (spec.rejectExecutableDirs || ["scripts"]).map((d) => d.toLowerCase()),
  );

  for (const folder of folders) {
    if (candidates.length >= policy.crawler.maxCandidatesPerDay) break;
    const skillFile = path.join(folder, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const relRaw = path.relative(dest, folder).replace(/\\/g, "/");
    const rel = relRaw === "" ? "." : relRaw;
    const folderName =
      rel === "."
        ? normalizeName(spec.idNamespace) || path.basename(dest)
        : path.basename(folder);
    const id = namespacedId(
      rel === "." ? "openvideo" : folderName,
      spec.idNamespace,
    );
    const blockedExec = [...rejectDirs].find((d) =>
      existsSync(path.join(folder, d)),
    );
    const hasScripts = existsSync(path.join(folder, "scripts"));
    const sourceUrl =
      rel === "."
        ? `https://github.com/${spec.repo}/tree/HEAD`
        : `https://github.com/${spec.repo}/tree/HEAD/${rel}`;
    const base = { id, sourceUrl, sourceId: spec.id, repo: spec.repo };

    // For root skills with known executable dirs: if sparse missed them, probe git tree
    let blocked = blockedExec;
    if (!blocked && spec.rootSkill && rejectDirs.size) {
      const ls = spawnSync("git", ["ls-tree", "-d", "--name-only", "HEAD"], {
        cwd: dest,
        encoding: "utf8",
      });
      const top = new Set(
        String(ls.stdout || "")
          .split(/\r?\n/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
      blocked = [...rejectDirs].find((d) => top.has(d)) || null;
    }

    if (blocked) {
      rejected.push({
        ...base,
        reason: `pasta ${blocked}/ (SAFE reject — executable helpers)`,
      });
      continue;
    }
    if (hasScripts) {
      rejected.push({ ...base, reason: "pasta scripts/" });
      continue;
    }

    try {
      const md = readFileSync(skillFile, "utf8");
      const { meta, body } = parseFrontmatter(md);
      const name = meta.name || folderName;
      let desc = meta.description || "";
      const lic = normalizeLicense(meta.license, spec.defaultLicense);
      const minDesc = policy.quality.minDescriptionLength;

      if (!desc) {
        rejected.push({ ...base, reason: "description curta" });
        continue;
      }
      const padded = padDescription(desc, folderName, minDesc);
      const paddedApplied = padded !== desc;
      desc = padded;

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

      let localPath = skillFile;
      if (paddedApplied || !meta.license) {
        const enrichedDir = path.join(staging, "enriched", id);
        mkdirSync(enrichedDir, { recursive: true });
        localPath = path.join(enrichedDir, "SKILL.md");
        writeFileSync(
          localPath,
          enrichSkillMd(md, { name, description: desc, license: lic }),
          "utf8",
        );
      }

      seenFp.add(fp);
      const rawUrl =
        rel === "."
          ? `https://raw.githubusercontent.com/${spec.repo}/HEAD/SKILL.md`
          : `https://raw.githubusercontent.com/${spec.repo}/HEAD/${rel}/SKILL.md`;
      candidates.push({
        id,
        name: normalizeName(name),
        description: desc,
        license: lic,
        sourceUrl,
        rawUrl,
        sourceId: spec.id,
        repo: spec.repo,
        fingerprint: fp,
        score,
        hasScriptsHint: false,
        requiresManualReview: false,
        status: "staging",
        fetchedAt: new Date().toISOString(),
        localPath,
        descriptionPadded: paddedApplied,
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
  note: `import-local-repos IMPORT_SET=${importSet}. Video/marketing/new packages.`,
  importSet,
  repos: REPOS.map((r) => r.repo),
  candidates: [...byFp.values()].sort((a, b) => (b.score || 0) - (a.score || 0)),
  rejected: [...(prev.rejected || []), ...rejected],
};

writeFileSync(outFile, JSON.stringify(merged, null, 2) + "\n", "utf8");

const reportFile = path.join(staging, `import-video-report-${day}.json`);
const report = {
  date: day,
  importSet,
  repos: REPOS.map((r) => ({ id: r.id, repo: r.repo })),
  candidatesThisRun: candidates.length,
  rejectedThisRun: rejected.length,
  rejectedSample: rejected.slice(0, 50),
  notes: [
    "remotion-dev/skills: no LICENSE file (GitHub SPDX null); defaultLicense MIT per brief",
    "Bomx/OpenVideo: reject SAFE when tools/ or scripts/ present at skill root",
    "calesthio/OpenMontage → OpenMontageInc/OpenMontage AGPL-3.0 (expect license gate rejects)",
  ],
};
writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(
  `OK: ${candidates.length} novos candidatos deste import; total merged ${merged.candidates.length} → ${path.relative(root, outFile)}`,
);
console.log(`rejeitados neste import: ${rejected.length}`);
console.log(`report → ${path.relative(root, reportFile)}`);
