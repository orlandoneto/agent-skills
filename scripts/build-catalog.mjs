import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listSkillDirs,
  loadPolicy,
  validateSkillDir,
} from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const catalogPath = path.join(root, "catalog.json");
const prev = JSON.parse(readFileSync(catalogPath, "utf8"));
const byId = new Map((prev.skills || []).map((s) => [s.id, s]));

const skills = [];
for (const { origin, id, skillPath } of listSkillDirs(path.join(root, "skills"))) {
  const result = validateSkillDir(skillPath, policy, { expectedId: id });
  if (!result.ok) {
    console.warn(`skip inválido ${origin}/${id}:`, result.errors.join("; "));
    continue;
  }
  const old = byId.get(id) || {};
  const status =
    old.status === "published" || origin === "ontoom" ? "published" : old.status || "published";
  const today = new Date().toISOString().slice(0, 10);
  skills.push({
    id,
    name: result.meta.name || id,
    description: result.meta.description || old.description || "",
    tags: old.tags || (origin === "ontoom" ? ["ontoom"] : ["community"]),
    origin,
    status,
    license: result.meta.license || old.license || "MIT",
    sourceUrl: old.sourceUrl || null,
    path: `skills/${origin}/${id}`,
    worksWith: old.worksWith || ["cursor", "claude-code", "codex", "gemini", "any"],
    // Sempre espelho orlandoneto — sourceUrl guarda o upstream para crédito
    github: `https://github.com/orlandoneto/agent-skills/tree/main/skills/${origin}/${id}`,
    download:
      old.download ||
      `https://github.com/orlandoneto/agent-skills/releases/latest/download/${id}.zip`,
    fingerprint: result.fingerprint,
    score: result.score,
    reviewed: origin === "ontoom" ? true : Boolean(old.reviewed),
    hasScripts: result.hasScripts,
    // Data de entrada no buscador (preserva; backfill = updatedAt antigo)
    addedAt: old.addedAt || old.updatedAt || today,
    updatedAt: today,
    sourceStars: typeof old.sourceStars === "number" ? old.sourceStars : undefined,
  });
}

const catalog = {
  version: prev.version || 1,
  updatedAt: new Date().toISOString().slice(0, 10),
  repo: prev.repo || "https://github.com/orlandoneto/agent-skills",
  policyVersion: policy.version,
  skills,
};

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log(`catalog.json: ${skills.length} skills`);
