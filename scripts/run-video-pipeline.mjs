/**
 * One-shot video pack pipeline with file logging (shell stdout may be empty).
 *   node scripts/run-video-pipeline.mjs
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staging = path.join(root, "staging");
mkdirSync(staging, { recursive: true });
const logPath = path.join(staging, `video-pipeline-${new Date().toISOString().slice(0, 10)}.log`);

function log(line) {
  const s = typeof line === "string" ? line : JSON.stringify(line);
  appendFileSync(logPath, s + "\n", "utf8");
  try {
    console.log(s);
  } catch {
    /* ignore */
  }
}

function run(cmd, args, env = {}) {
  log(`\n=== ${cmd} ${args.join(" ")} ===`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === "win32",
  });
  if (r.stdout) log(r.stdout.trimEnd());
  if (r.stderr) log(r.stderr.trimEnd());
  log(`exit=${r.status}`);
  return r.status ?? 1;
}

writeFileSync(logPath, `start ${new Date().toISOString()}\n`, "utf8");

let code = 0;
code = run(process.execPath, ["scripts/seed-video-pack.mjs"]) || code;
code = run(process.execPath, ["scripts/import-local-repos.mjs"], { IMPORT_SET: "video" }) || code;
code = run("npm", ["run", "publish-safe"]) || code;
code = run("npm", ["run", "enrich-stars"]) || code;
code = run("npm", ["run", "catalog:build"]) || code;
code = run("npm", ["test"]) || code;

log(`\nDONE code=${code} log=${logPath}`);
process.exit(code);
