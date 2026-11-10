import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { listSkillDirs } from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist", "zips");
mkdirSync(outDir, { recursive: true });

const dirs = listSkillDirs(path.join(root, "skills"));
for (const { id, skillPath } of dirs) {
  const zipPath = path.join(outDir, `${id}.zip`);
  // Prefer tar (GitHub runners / Windows 10+ often have tar)
  const r = spawnSync(
    "tar",
    ["-a", "-c", "-f", zipPath, "-C", skillPath, "."],
    { stdio: "inherit" },
  );
  if (r.status !== 0) {
    console.error(`falha ao zipar ${id}`);
    process.exit(1);
  }
  console.log("zip", path.relative(root, zipPath));
}

console.log(`${dirs.length} ZIP(s) em dist/zips/ — um por skill (não o monorepo).`);
