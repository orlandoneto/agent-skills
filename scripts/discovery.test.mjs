import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDynamicSource,
  emptyDiscoveryState,
  isOwnMirror,
  mapSpdxToAllowlist,
  mergeCrawlSources,
  nextQueryPage,
  normalizeRepoFullName,
  policyRepoSet,
  shouldInspectRepo,
} from "./lib/discovery.mjs";

test("normalizeRepoFullName", () => {
  assert.equal(
    normalizeRepoFullName("https://github.com/Foo/Bar.git"),
    "foo/bar",
  );
});

test("isOwnMirror", () => {
  assert.equal(isOwnMirror("orlandoneto/agent-skills"), true);
  assert.equal(isOwnMirror("addyosmani/agent-skills"), false);
});

test("shouldInspectRepo — novo e recheck", () => {
  assert.equal(shouldInspectRepo(null).inspect, true);
  const recent = {
    status: "dynamic",
    lastCheckedAt: new Date().toISOString(),
  };
  assert.equal(shouldInspectRepo(recent, { recheckDays: 7 }).inspect, false);
  const old = {
    status: "exhausted",
    lastCheckedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  };
  assert.equal(shouldInspectRepo(old, { recheckDays: 7 }).inspect, true);
  assert.equal(
    shouldInspectRepo({ status: "rejected", lastCheckedAt: null }).inspect,
    false,
  );
});

test("nextQueryPage avança e marca done", () => {
  assert.deepEqual(nextQueryPage({ lastPage: 0 }, { maxPages: 2 }), {
    page: 1,
    done: false,
  });
  assert.deepEqual(nextQueryPage({ lastPage: 2 }, { maxPages: 2 }), {
    page: null,
    done: true,
  });
  assert.deepEqual(nextQueryPage({ done: true, lastPage: 1 }), {
    page: null,
    done: true,
  });
});

test("mapSpdxToAllowlist", () => {
  const allow = ["MIT", "Apache-2.0"];
  assert.equal(mapSpdxToAllowlist("MIT", allow), "MIT");
  assert.equal(mapSpdxToAllowlist("Apache-2.0", allow), "Apache-2.0");
  assert.equal(mapSpdxToAllowlist("GPL-3.0", allow), null);
});

test("mergeCrawlSources dedupe policy vence", () => {
  const merged = mergeCrawlSources(
    [
      {
        id: "static",
        type: "github-repo-skills",
        repo: "addyosmani/agent-skills",
        enabled: true,
      },
    ],
    [
      {
        id: "dup",
        type: "github-repo-skills",
        repo: "AddyOsmani/agent-skills",
        enabled: true,
      },
      {
        id: "new",
        type: "github-repo-skills",
        repo: "someone/new-skills",
        enabled: true,
      },
    ],
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[1].repo, "someone/new-skills");
});

test("buildDynamicSource id estável", () => {
  const s = buildDynamicSource({
    repo: "Acme/Skills",
    path: "skills",
    defaultLicense: "MIT",
    discoveredAt: "2026-11-12",
  });
  assert.equal(s.id, "discovered-acme-skills");
  assert.equal(s.type, "github-repo-skills");
  assert.equal(s.enabled, true);
});

test("policyRepoSet + empty state", () => {
  const set = policyRepoSet({
    crawler: {
      sourcesAllowlist: [
        { type: "github-repo-skills", repo: "A/B" },
        { type: "local-manifest", path: "x" },
      ],
    },
  });
  assert.equal(set.has("a/b"), true);
  assert.equal(emptyDiscoveryState().version, 1);
});
