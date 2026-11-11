/**
 * Resumo humano do crawl do dia: novos, skipped, held + histórico de addedAt.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export function buildCrawlSummaryMarkdown({
  day,
  report,
  candidates = [],
  rejected = [],
  catalogSkills = [],
}) {
  const published = report?.published || [];
  const skipped = report?.skipped || [];
  const held = report?.held || [];

  const lines = [];
  lines.push(`# Crawl summary — ${day}`);
  lines.push("");
  lines.push(`- **Novos publicados:** ${published.length}`);
  lines.push(`- **Candidatos staging:** ${candidates.length}`);
  lines.push(`- **Rejeitados no crawl:** ${rejected.length}`);
  lines.push(`- **Skipped no publish:** ${skipped.length}`);
  lines.push(`- **Held (manual/teto):** ${held.length}`);
  lines.push("");

  if (published.length) {
    lines.push("## Adicionados neste run");
    for (const p of published) {
      lines.push(
        `- **${p.id}** — ${day}${p.sourceUrl ? ` · [fonte](${p.sourceUrl})` : ""}`,
      );
    }
    lines.push("");
  } else {
    lines.push("## Adicionados neste run");
    lines.push("_Nenhum skill novo SAFE hoje._");
    lines.push("");
  }

  if (skipped.length) {
    lines.push("## Skipped (por quê)");
    for (const s of skipped.slice(0, 40)) {
      lines.push(`- \`${s.id}\`: ${s.reason}`);
    }
    if (skipped.length > 40) lines.push(`- … +${skipped.length - 40} mais`);
    lines.push("");
  }

  if (held.length) {
    lines.push("## Held");
    for (const h of held.slice(0, 20)) {
      lines.push(`- \`${h.id}\`: ${h.reason}`);
    }
    lines.push("");
  }

  // Histórico: quando entraram no catálogo
  const withDate = (catalogSkills || [])
    .filter((s) => s.addedAt || s.updatedAt)
    .map((s) => ({
      id: s.id,
      addedAt: s.addedAt || s.updatedAt,
      origin: s.origin,
    }))
    .sort((a, b) => String(b.addedAt).localeCompare(String(a.addedAt)));

  const byDay = new Map();
  for (const s of withDate) {
    const d = String(s.addedAt).slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(s.id);
  }

  lines.push("## Quando foram adicionados (catálogo)");
  const days = [...byDay.keys()].sort((a, b) => b.localeCompare(a)).slice(0, 14);
  if (days.length === 0) {
    lines.push("_Sem datas no catalog ainda._");
  } else {
    for (const d of days) {
      const ids = byDay.get(d);
      lines.push(`- **${d}** — ${ids.length}: ${ids.slice(0, 12).join(", ")}${ids.length > 12 ? ` (+${ids.length - 12})` : ""}`);
    }
  }
  lines.push("");

  // Top motivos de rejeição (agrupa "duplicata de X" → "duplicata")
  const reasonCount = new Map();
  for (const r of rejected) {
    let key = String(r.reason || "unknown").split("→")[0].trim().slice(0, 80);
    if (/^duplicata\b/i.test(key)) key = "duplicata";
    reasonCount.set(key, (reasonCount.get(key) || 0) + 1);
  }
  if (reasonCount.size) {
    lines.push("## Rejeições (top)");
    const top = [...reasonCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    for (const [reason, n] of top) {
      lines.push(`- ${n}× ${reason}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function loadDayArtifacts(root, day) {
  const stagingDir = path.join(root, "staging");
  const reportPath = path.join(stagingDir, `publish-report-${day}.json`);
  const candPath = path.join(stagingDir, `candidates-${day}.json`);
  const catalogPath = path.join(root, "catalog.json");

  const report = existsSync(reportPath)
    ? JSON.parse(readFileSync(reportPath, "utf8"))
    : { published: [], skipped: [], held: [] };
  const batch = existsSync(candPath)
    ? JSON.parse(readFileSync(candPath, "utf8"))
    : { candidates: [], rejected: [] };
  const catalog = existsSync(catalogPath)
    ? JSON.parse(readFileSync(catalogPath, "utf8"))
    : { skills: [] };

  return {
    report,
    candidates: batch.candidates || [],
    rejected: batch.rejected || [],
    catalogSkills: catalog.skills || [],
  };
}

export function latestCandidatesDay(root) {
  const stagingDir = path.join(root, "staging");
  if (!existsSync(stagingDir)) return new Date().toISOString().slice(0, 10);
  const files = readdirSync(stagingDir)
    .filter((f) => f.startsWith("candidates-") && f.endsWith(".json"))
    .sort();
  if (!files.length) return new Date().toISOString().slice(0, 10);
  return files[files.length - 1].replace(/^candidates-/, "").replace(/\.json$/, "");
}
