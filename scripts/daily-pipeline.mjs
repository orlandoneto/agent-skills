/**
 * Pipeline diário com retry:
 *   discover-repos → crawl → publish-safe → catalog → summary
 * → (opcional) sync snapshot no Ontoom + dispara workflow de sync.
 *
 * Uso:
 *   npm run daily
 *   ONTOOM_ROOT=../ontoom npm run daily
 *   SKIP_SYNC=1 npm run daily
 *   SKIP_DISCOVER=1 npm run daily
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxAttempts = Number(process.env.CRAWL_RETRIES || 3);
const ontoomRoot =
  process.env.ONTOOM_ROOT?.trim() ||
  path.resolve(root, "..", "ontoom");
const skipSync = process.env.SKIP_SYNC === "1";
const skipDiscover = process.env.SKIP_DISCOVER === "1";

function run(cmd, args, { allowFail = false } = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0 && !allowFail) {
    throw new Error(`${cmd} ${args.join(" ")} exit ${r.status}`);
  }
  return r.status ?? 1;
}

function sleep(ms) {
  spawnSync(process.execPath, ["-e", `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${ms})`], {
    stdio: "ignore",
  });
}

async function main() {
  if (!skipDiscover) {
    // Descoberta GitHub → dynamic-sources + discovery-state (não falha o dia)
    run("npm", ["run", "discover"], { allowFail: true });
  } else {
    console.log("SKIP_DISCOVER=1 — pulando discover-repos");
  }

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n=== crawl attempt ${attempt}/${maxAttempts} ===`);
      run("npm", ["run", "crawl"]);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.error(`crawl falhou (tentativa ${attempt}):`, err.message);
      if (attempt < maxAttempts) {
        const wait = attempt * 15_000;
        console.log(`retry em ${wait / 1000}s…`);
        sleep(wait);
      }
    }
  }
  if (lastErr) throw lastErr;

  run("npm", ["run", "publish-safe"]);
  run("npm", ["run", "enrich-stars"]);
  run("npm", ["run", "catalog:build"]);
  run("npm", ["test"]);
  run("npm", ["run", "crawl:summary"]);

  // Heartbeat local (Action também grava)
  const staging = path.join(root, "staging");
  mkdirSync(staging, { recursive: true });
  writeFileSync(
    path.join(staging, "last-crawl.json"),
    JSON.stringify(
      {
        ok: true,
        at: new Date().toISOString(),
        via: "daily-pipeline",
        attempts: maxAttempts,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  if (!skipSync) {
    syncOntoomsSnapshot();
  }

  console.log("\n✅ daily-pipeline OK");
}

function syncOntoomsSnapshot() {
  const src = path.join(root, "catalog.json");
  if (!existsSync(src)) {
    console.warn("catalog.json ausente — skip sync Ontoom");
    return;
  }
  const dest = path.join(ontoomRoot, "src", "data", "agent-skills-catalog.json");
  if (!existsSync(path.dirname(dest))) {
    console.warn(`Ontoom não encontrado em ${ontoomRoot} — skip sync arquivo`);
  } else {
    copyFileSync(src, dest);
    const n = JSON.parse(readFileSync(src, "utf8")).skills?.length ?? 0;
    console.log(`sync snapshot Ontoom → ${dest} (${n} skills)`);
  }

  // Dispara workflow no Ontoom se GH_TOKEN + repo conhecidos
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const ontoomRepo = process.env.ONTOOM_REPO || "orlandoneto/ontoom";
  if (!token) {
    console.log("Sem GH_TOKEN — sync remoto Ontoom fica para o cron sync-skills-catalog");
    return;
  }
  try {
    const res = spawnSync(
      "gh",
      [
        "workflow",
        "run",
        "sync-skills-catalog.yml",
        "--repo",
        ontoomRepo,
        "--ref",
        "main",
      ],
      { encoding: "utf8", env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token } },
    );
    if (res.status === 0) {
      console.log(`dispatched sync-skills-catalog em ${ontoomRepo}`);
    } else {
      // Fallback API
      const body = JSON.stringify({ ref: "main" });
      const api = spawnSync(
        "curl",
        [
          "-sS",
          "-X",
          "POST",
          "-H",
          `Authorization: Bearer ${token}`,
          "-H",
          "Accept: application/vnd.github+json",
          "-H",
          "Content-Type: application/json",
          `https://api.github.com/repos/${ontoomRepo}/actions/workflows/sync-skills-catalog.yml/dispatches`,
          "-d",
          body,
        ],
        { encoding: "utf8" },
      );
      console.log(
        api.status === 0
          ? `API dispatch sync-skills-catalog → ${ontoomRepo}`
          : `não deu para disparar Ontoom (${api.stderr || api.stdout || api.status})`,
      );
    }
  } catch (err) {
    console.warn("dispatch Ontoom falhou:", err.message);
  }
}

main().catch((err) => {
  console.error("\n❌ daily-pipeline:", err.message);
  process.exit(1);
});
