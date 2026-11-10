/**
 * Publica candidatos SAFE do staging → skills/community/ + atualiza catalog.
 * Alimenta o buscador Ontoom via catalog.json + (na Action) Release ZIP.
 *
 * Safe = licença allowlist + sem scripts + score >= minScoreToPublish + sem duplicata.
 * Teto: policy.crawler.maxAutoPromotePerDay
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectFingerprints,
  loadPolicy,
  normalizeName,
  parseFrontmatter,
  validateSkillDir,
} from "./lib/gates.mjs";
import { fetchText } from "./lib/fetch-text.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const maxAuto = policy.crawler.maxAutoPromotePerDay ?? 0;

const out = {
  published: [],
  skipped: [],
  held: [],
};

if (maxAuto <= 0) {
  console.log("maxAutoPromotePerDay=0 — nada a publicar (modo só radar).");
  writeReport(out);
  process.exit(0);
}

const stagingDir = path.join(root, "staging");
const files = existsSync(stagingDir)
  ? readdirSync(stagingDir)
      .filter((f) => f.startsWith("candidates-") && f.endsWith(".json"))
      .sort()
  : [];

if (files.length === 0) {
  console.log("Nenhum staging/candidates-*.json");
  writeReport(out);
  process.exit(0);
}

const latestFile = files[files.length - 1];
const batch = JSON.parse(readFileSync(path.join(stagingDir, latestFile), "utf8"));
const candidates = [...(batch.candidates || [])].sort(
  (a, b) => (b.score || 0) - (a.score || 0),
);

let fps = collectFingerprints(root, policy);
let communityCount = existsSync(path.join(root, "skills", "community"))
  ? readdirSync(path.join(root, "skills", "community")).length
  : 0;

const catalogPath = path.join(root, "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const existingIds = new Set((catalog.skills || []).map((s) => s.id));

for (const cand of candidates) {
  if (out.published.length >= maxAuto) {
    out.held.push({ id: cand.id, reason: "teto maxAutoPromotePerDay" });
    continue;
  }

  const id = normalizeName(cand.id || cand.name);
  if (!id) {
    out.skipped.push({ id: cand.id, reason: "id inválido" });
    continue;
  }
  if (existingIds.has(id) || existsSync(path.join(root, "skills", "community", id))) {
    out.skipped.push({ id, reason: "já publicado (id)" });
    continue;
  }
  if (cand.requiresManualReview || cand.hasScriptsHint) {
    out.held.push({ id, reason: "scripts → só manual" });
    continue;
  }
  if ((cand.score || 0) < policy.quality.minScoreToPublish) {
    out.skipped.push({ id, reason: `score ${cand.score}` });
    continue;
  }
  if (fps.has(cand.fingerprint)) {
    out.skipped.push({ id, reason: "duplicata fingerprint" });
    continue;
  }
  if (communityCount >= policy.crawler.maxPublishedCommunity) {
    out.held.push({ id, reason: "maxPublishedCommunity" });
    break;
  }

  try {
    let md = await fetchText(cand.rawUrl, {
      userAgent: policy.crawler.userAgent,
    });
    md = ensureLicenseFrontmatter(md, cand.license || "Apache-2.0");

    const dest = path.join(root, "skills", "community", id);
    mkdirSync(dest, { recursive: true });
    writeFileSync(path.join(dest, "SKILL.md"), md, "utf8");

    // LICENSE.txt opcional do upstream (anthropics)
    if (cand.repo === "anthropics/skills" || (cand.sourceUrl || "").includes("anthropics/skills")) {
      try {
        const licUrl = `https://raw.githubusercontent.com/anthropics/skills/main/skills/${id}/LICENSE.txt`;
        const lic = await fetchText(licUrl, { userAgent: policy.crawler.userAgent });
        if (lic && lic.length > 20) {
          writeFileSync(path.join(dest, "LICENSE.txt"), lic, "utf8");
        }
      } catch {
        /* opcional */
      }
    }

    const result = validateSkillDir(dest, policy, { expectedId: id });
    if (!result.ok) {
      out.skipped.push({ id, reason: result.errors.join("; ") });
      // rollback pasta inválida
      try {
        const { rmSync } = await import("node:fs");
        rmSync(dest, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      continue;
    }

    catalog.skills = (catalog.skills || []).filter((s) => s.id !== id);
    catalog.skills.push({
      id,
      name: result.meta.name || id,
      description: result.meta.description || cand.description || "",
      tags: ["community", "auto"],
      origin: "community",
      status: "published",
      license: result.meta.license || cand.license || "Apache-2.0",
      sourceUrl: cand.sourceUrl || null,
      path: `skills/community/${id}`,
      worksWith: ["cursor", "claude-code", "codex", "gemini", "any"],
      // Ver no GitHub = espelho nosso; crédito ao autor fica em sourceUrl (UI discreta)
      github: `https://github.com/orlandoneto/agent-skills/tree/main/skills/community/${id}`,
      download: `https://github.com/orlandoneto/agent-skills/releases/latest/download/${id}.zip`,
      fingerprint: result.fingerprint,
      score: result.score,
      reviewed: false,
      hasScripts: false,
      updatedAt: new Date().toISOString().slice(0, 10),
    });

    appendNotice(id, result.meta.license || cand.license, cand.sourceUrl);
    existingIds.add(id);
    communityCount += 1;
    fps.set(result.fingerprint, { origin: "community", id });
    out.published.push({ id, score: result.score, sourceUrl: cand.sourceUrl });
    console.log(`PUBLISH ${id} score=${result.score}`);
  } catch (err) {
    out.skipped.push({ id, reason: err.message });
  }
}

catalog.updatedAt = new Date().toISOString().slice(0, 10);
catalog.policyVersion = policy.version;
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
writeReport(out);

console.log(
  `\nPublicados: ${out.published.length} | skipped: ${out.skipped.length} | held: ${out.held.length}`,
);
if (out.published.length === 0) {
  console.log("Nenhum skill novo safe hoje (ok). Buscador inalterado.");
}

function ensureLicenseFrontmatter(md, license) {
  const { meta, body } = parseFrontmatter(md);
  if (meta.license && policy.licenses.allow.some((l) => l.toLowerCase() === meta.license.toLowerCase())) {
    return md;
  }
  if (!md.startsWith("---")) {
    return `---\nname: ${meta.name || "skill"}\ndescription: ${meta.description || "Community agent skill."}\nlicense: ${license}\n---\n${md}`;
  }
  if (/^license:/m.test(md.slice(0, md.indexOf("\n---", 3) + 1) || "")) {
    return md.replace(/^license:\s*.+$/m, `license: ${license}`);
  }
  return md.replace(/^---\r?\n/, `---\nlicense: ${license}\n`);
}

function appendNotice(id, license, sourceUrl) {
  const noticePath = path.join(root, "NOTICE");
  const line = `- ${id}: ${license || "Apache-2.0"} — ${sourceUrl || "upstream"} (auto publish-safe)\n`;
  let text = readFileSync(noticePath, "utf8");
  if (text.includes(`- ${id}:`)) return;
  if (text.includes("None published yet")) {
    text = text.replace(
      "(None published yet — add a line when promoting a community skill.)\n",
      line,
    );
  } else {
    text = text.trimEnd() + "\n" + line;
  }
  writeFileSync(noticePath, text.endsWith("\n") ? text : text + "\n", "utf8");
}

function writeReport(report) {
  const stagingDir = path.join(root, "staging");
  mkdirSync(stagingDir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(stagingDir, `publish-report-${day}.json`);
  writeFileSync(
    file,
    JSON.stringify({ date: day, ...report }, null, 2) + "\n",
    "utf8",
  );
  console.log(`report → ${path.relative(root, file)}`);
}
