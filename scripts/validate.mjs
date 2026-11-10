import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectFingerprints,
  listSkillDirs,
  loadPolicy,
  validateSkillDir,
} from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadPolicy(root);
const skillsRoot = path.join(root, "skills");
const dirs = listSkillDirs(skillsRoot);

let failed = 0;
const seen = new Map();

for (const { origin, id, skillPath } of dirs) {
  const result = validateSkillDir(skillPath, policy, { expectedId: id });
  const label = `${origin}/${id}`;
  if (!result.ok) {
    failed += 1;
    console.error(`FAIL ${label}`);
    for (const e of result.errors) console.error(`  - ${e}`);
  } else {
    console.log(
      `OK   ${label}  score=${result.score}  fp=${result.fingerprint}${
        result.requiresManualReview ? "  [manual-review]" : ""
      }`,
    );
  }
  for (const w of result.warnings) console.warn(`  ! ${w}`);

  if (policy.dedupe.rejectIfSameFingerprintExists && result.fingerprint) {
    if (seen.has(result.fingerprint)) {
      failed += 1;
      console.error(
        `FAIL ${label} duplicata de ${seen.get(result.fingerprint)} (fingerprint)`,
      );
    } else {
      seen.set(result.fingerprint, label);
    }
  }
}

// Cross-check map helper stays warm for promote/crawl
collectFingerprints(root, policy);

if (failed > 0) {
  console.error(`\n${failed} falha(s). Ver docs/QUALITY_GATES.md`);
  process.exit(1);
}
console.log(`\n${dirs.length} skill(s) válidos.`);
