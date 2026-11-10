import test from "node:test";
import assert from "node:assert/strict";
import {
  fingerprint,
  normalizeName,
  parseFrontmatter,
  scoreSkill,
} from "./lib/gates.mjs";

test("normalizeName remove ruído", () => {
  assert.equal(normalizeName("Remove Background!"), "remove-background");
});

test("fingerprint estável para mesmo corpo", () => {
  const a = fingerprint({ name: "seo-audit", body: "hello\n" });
  const b = fingerprint({ name: "SEO-Audit", body: "hello" });
  assert.equal(a, b);
});

test("parseFrontmatter lê name e description", () => {
  const md = `---
name: demo-skill
description: Uma description longa o bastante para passar no gate anti-lixo do catalog.
license: MIT
---
# Demo
`;
  const { meta } = parseFrontmatter(md);
  assert.equal(meta.name, "demo-skill");
  assert.equal(meta.license, "MIT");
});

test("parseFrontmatter lê description folded >-", () => {
  const md = `---
name: folded-skill
description: >-
  Linha um da description que precisa passar do minimo
  e continuar na linha dois sem quebrar o gate.
license: Apache-2.0
---
# Body
`;
  const { meta } = parseFrontmatter(md);
  assert.ok(meta.description.length >= 40);
  assert.match(meta.description, /Linha um/);
});

test("score penaliza scripts e premia licença", () => {
  const base = {
    meta: {
      name: "x",
      description: "x".repeat(50),
    },
    body: "y".repeat(250),
  };
  const withLicense = scoreSkill({ ...base, hasScripts: false, licenseOk: true });
  const withScripts = scoreSkill({ ...base, hasScripts: true, licenseOk: true });
  assert.ok(withLicense > withScripts);
});
