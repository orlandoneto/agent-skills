/**
 * fetch com fallback PowerShell no Windows (TLS corporativo).
 */
export async function fetchText(url, { userAgent, token } = {}) {
  const headers = {
    "User-Agent": userAgent || "OntoomSkillCrawler/1.0",
    Accept: "application/vnd.github+json, text/plain, */*",
  };
  const auth = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (auth) headers.Authorization = `Bearer ${auth}`;

  try {
    const res = await fetch(url, { headers });
    if (res.status === 403 || res.status === 429) {
      throw new Error(`rate-limit/ToS risk HTTP ${res.status} em ${url}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.text();
  } catch (err) {
    if (process.platform !== "win32") throw err;
    const { spawnSync } = await import("node:child_process");
    const authLine = headers.Authorization
      ? `$h['Authorization']='${headers.Authorization}';`
      : "";
    const ps = `
      $h=@{'User-Agent'='${headers["User-Agent"]}';'Accept'='application/vnd.github+json, text/plain, */*'};
      ${authLine}
      (Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -Headers $h -UseBasicParsing).Content
    `;
    const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (r.status !== 0) {
      throw new Error(err.message + " | ps: " + (r.stderr || r.stdout || ""));
    }
    return r.stdout;
  }
}
