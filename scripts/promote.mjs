/**
 * Promove um candidato de staging → skills/community/ + linha no catalog.
 * Recusa se gates falharem (licença, scripts sem override, score, duplicata).
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
  validateSkillDir,
} from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const idArg = process.argv[2];
const forceManual = process.argv.includes("--i-reviewed-scripts");

if (!idArg) {
  console.error("Uso: npm run promote -- <skill-id> [--i-reviewed-scripts]");
  process.exit(1);
}

const id = normalizeName(idArg);
const stagingDir = path.join(root, "staging");
const files = existsSync(stagingDir)
  ? readdirSync(stagingDir).filter((f) => f.startsWith("candidates-") && f.endsWith(".json"))
  : [];
files.sort();

let found = null;
let fromFile = null;
for (const f of files.reverse()) {
  const data = JSON.parse(readFileSync(path.join(stagingDir, f), "utf8"));
  const hit = (data.candidates || []).find((c) => c.id === id || c.name === id);
  if (hit) {
    found = hit;
    fromFile = f;
    break;
  }
}

if (!found) {
  console.error(`Candidato "${id}" não encontrado em staging/`);
  process.exit(1);
}

if (found.requiresManualReview && !forceManual) {
  console.error(
    "Skill indica scripts — recusado. Revise o código e use --i-reviewed-scripts",
  );
  process.exit(1);
}

if (found.score < policy.quality.minScoreToPublish) {
  console.error(
    `score ${found.score} < minScoreToPublish ${policy.quality.minScoreToPublish}`,
  );
  process.exit(1);
}

const fps = collectFingerprints(root, policy);
if (fps.has(found.fingerprint)) {
  console.error("duplicata fingerprint já publicada");
  process.exit(1);
}

const communityCount = existsSync(path.join(root, "skills", "community"))
  ? readdirSync(path.join(root, "skills", "community")).length
  : 0;
if (communityCount >= policy.crawler.maxPublishedCommunity) {
  console.error("maxPublishedCommunity atingido — pare de espelhar");
  process.exit(1);
}

const md = await (await fetch(found.rawUrl, {
  headers: { "User-Agent": policy.crawler.userAgent },
})).text();

const dest = path.join(root, "skills", "community", id);
mkdirSync(dest, { recursive: true });
writeFileSync(path.join(dest, "SKILL.md"), md, "utf8");

const result = validateSkillDir(dest, policy, { expectedId: id });
if (!result.ok) {
  console.error("validação pós-cópia falhou:", result.errors);
  process.exit(1);
}

// rebuild catalog entry hint
const catalogPath = path.join(root, "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog.skills = catalog.skills.filter((s) => s.id !== id);
catalog.skills.push({
  id,
  name: id,
  description: found.description,
  tags: ["community"],
  origin: "community",
  status: "published",
  license: found.license,
  sourceUrl: found.sourceUrl,
  path: `skills/community/${id}`,
  worksWith: ["cursor", "claude-code", "codex", "gemini", "any"],
  github: `https://github.com/orlandoneto/agent-skills/tree/main/skills/community/${id}`,
  download: `https://github.com/orlandoneto/agent-skills/releases/latest/download/${id}.zip`,
  fingerprint: found.fingerprint,
  score: found.score,
  reviewed: Boolean(forceManual || !found.requiresManualReview),
  updatedAt: new Date().toISOString().slice(0, 10),
});
catalog.updatedAt = new Date().toISOString().slice(0, 10);
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");

const notice = path.join(root, "NOTICE");
const line = `- ${id}: ${found.license} — ${found.sourceUrl} (via ${fromFile})\n`;
writeFileSync(notice, readFileSync(notice, "utf8").replace(
  "(None published yet — add a line when promoting a community skill.)\n",
  line,
), "utf8");

console.log(`promovido: skills/community/${id} (de ${fromFile})`);
console.log("rode: npm run validate && tag Release para gerar ZIP");
