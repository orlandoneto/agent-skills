import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export function loadPolicy(root) {
  return JSON.parse(readFileSync(path.join(root, "policy.json"), "utf8"));
}

export function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseFrontmatter(md) {
  const match = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: String(md) };
  const meta = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // YAML folded/literal: description: >-  / |
    if (value === ">" || value === ">|" || value === ">-" || value === "|" || value === "|-" || value === "|+") {
      const chunks = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        i += 1;
        chunks.push(lines[i].replace(/^\s+/, ""));
      }
      value = chunks.join(" ").trim();
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: match[2] };
}

export function bodyHash(body) {
  return createHash("sha256").update(String(body).trim()).digest("hex").slice(0, 16);
}

export function fingerprint({ name, body }) {
  return `${normalizeName(name)}::${bodyHash(body)}`;
}

export function listSkillDirs(skillsRoot) {
  if (!existsSync(skillsRoot)) return [];
  const out = [];
  for (const origin of readdirSync(skillsRoot)) {
    const originPath = path.join(skillsRoot, origin);
    if (!statSync(originPath).isDirectory()) continue;
    for (const id of readdirSync(originPath)) {
      const skillPath = path.join(originPath, id);
      if (!statSync(skillPath).isDirectory()) continue;
      out.push({ origin, id, skillPath });
    }
  }
  return out;
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

export function scoreSkill({ meta, body, hasScripts, licenseOk }) {
  let score = 0;
  if (meta.name) score += 15;
  if ((meta.description || "").length >= 40) score += 20;
  if ((body || "").length >= 200) score += 20;
  if (licenseOk) score += 25;
  if (!hasScripts) score += 15;
  else score -= 20;
  if (/when to use|use when|quando usar/i.test(`${meta.description}\n${body}`)) score += 5;
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate one skill folder against policy.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], meta: object, fingerprint: string, score: number, hasScripts: boolean, licenseOk: boolean }}
 */
export function validateSkillDir(skillPath, policy, { expectedId } = {}) {
  const errors = [];
  const warnings = [];
  const skillMd = path.join(skillPath, "SKILL.md");
  if (!existsSync(skillMd)) {
    return {
      ok: false,
      errors: ["SKILL.md ausente"],
      warnings,
      meta: {},
      fingerprint: "",
      score: 0,
      hasScripts: false,
      licenseOk: false,
    };
  }

  const raw = readFileSync(skillMd, "utf8");
  const bytes = Buffer.byteLength(raw, "utf8");
  if (bytes < policy.quality.minSkillMdBytes) errors.push(`SKILL.md muito curto (${bytes} B)`);
  if (bytes > policy.quality.maxSkillMdBytes) errors.push(`SKILL.md muito grande (${bytes} B)`);

  const { meta, body } = parseFrontmatter(raw);
  if (!meta.name) errors.push("frontmatter.name obrigatório");
  if (!meta.description) errors.push("frontmatter.description obrigatório");
  if (
    meta.description &&
    meta.description.length < policy.quality.minDescriptionLength
  ) {
    errors.push(
      `description < ${policy.quality.minDescriptionLength} chars (anti-lixo)`,
    );
  }

  const folderId = path.basename(skillPath);
  const id = expectedId || folderId;
  // Aceita id namespaced (ex.: ms-seo-audit) quando o name do frontmatter é seo-audit
  if (
    policy.quality.requireNameMatchesFolder &&
    meta.name &&
    normalizeName(meta.name) !== normalizeName(id) &&
    !normalizeName(id).endsWith(`-${normalizeName(meta.name)}`)
  ) {
    errors.push(`name "${meta.name}" deve casar com pasta "${id}"`);
  }

  const files = walkFiles(skillPath);
  const relFiles = files.map((f) => path.relative(skillPath, f).replace(/\\/g, "/"));
  const hasScriptsDir = existsSync(path.join(skillPath, "scripts"));
  const hasScripts = hasScriptsDir || relFiles.some((f) => f.startsWith("scripts/"));

  for (const rel of relFiles) {
    const lower = rel.toLowerCase();
    for (const frag of policy.security.blockedPathFragments) {
      if (lower.includes(frag.toLowerCase())) {
        errors.push(`path bloqueado: ${rel}`);
      }
    }
    const ext = path.extname(lower);
    if (policy.security.blockedExtensions.includes(ext)) {
      errors.push(`extensão bloqueada (segurança): ${rel}`);
    }
  }

  const licenseRaw = (meta.license || "").trim();
  const licenseOk =
    Boolean(licenseRaw) &&
    policy.licenses.allow.some(
      (l) => l.toLowerCase() === licenseRaw.toLowerCase(),
    );

  if (policy.licenses.requireDeclaredLicense && !licenseRaw) {
    errors.push("license ausente no frontmatter (gate de republicação)");
  } else if (licenseRaw && !licenseOk) {
    errors.push(`license "${licenseRaw}" fora da allowlist`);
  }

  if (hasScripts && !policy.security.autoPublishAllowedIfHasScripts) {
    warnings.push("contém scripts/ — publish só com review manual");
  }

  const fp = fingerprint({ name: meta.name || id, body });
  const score = scoreSkill({ meta, body, hasScripts, licenseOk });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta,
    body,
    fingerprint: fp,
    score,
    hasScripts,
    licenseOk,
    requiresManualReview: hasScripts,
  };
}

export function collectFingerprints(root, policy) {
  const skillsRoot = path.join(root, "skills");
  const map = new Map();
  for (const { origin, id, skillPath } of listSkillDirs(skillsRoot)) {
    const result = validateSkillDir(skillPath, policy, { expectedId: id });
    if (result.fingerprint) {
      map.set(result.fingerprint, { origin, id });
    }
  }
  return map;
}
