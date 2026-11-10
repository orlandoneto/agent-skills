# Alimenta skills/community a partir de anthropics/skills (Apache-2.0).
# Só pastas sem scripts/. Normaliza license no frontmatter + crédito.
# Uso: pwsh scripts/feed-anthropic.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$token = $env:GITHUB_TOKEN
if (-not $token) { $token = $env:GH_TOKEN }
if (-not $token) {
  $fill = (@("protocol=https", "host=github.com", "") -join "`n") | git credential fill
  $token = ($fill | Select-String '^password=').ToString().Substring(9)
}
if (-not $token) { throw "GITHUB_TOKEN/GH_TOKEN ausente" }

$headers = @{
  Authorization = "Bearer $token"
  "User-Agent"  = "OntoomSkillCrawler/1.0 (+https://www.ontoom.com.br/skills)"
  Accept        = "application/vnd.github+json"
}

# Markdown-first / sem scripts (revisado manualmente na lista)
$allow = @(
  "frontend-design",
  "doc-coauthoring",
  "brand-guidelines",
  "canvas-design",
  "internal-comms",
  "algorithmic-art",
  "theme-factory",
  "slack-gif-creator",
  "academy-guide",
  "discernment-nudge"
)

$community = Join-Path $root "skills\community"
New-Item -ItemType Directory -Force -Path $community | Out-Null
$promoted = @()

foreach ($id in $allow) {
  $listingUrl = "https://api.github.com/repos/anthropics/skills/contents/skills/$id"
  $items = Invoke-RestMethod -Uri $listingUrl -Headers $headers
  $names = @($items | ForEach-Object { $_.name })
  if ($names -contains "scripts") {
    Write-Host "SKIP $id (tem scripts/)"
    continue
  }

  $rawUrl = "https://raw.githubusercontent.com/anthropics/skills/main/skills/$id/SKILL.md"
  $md = Invoke-RestMethod -Uri $rawUrl -Headers @{
    Authorization = "Bearer $token"
    "User-Agent"  = "OntoomSkillCrawler/1.0"
  }

  # Garante license allowlist + crédito (repo Anthropic = Apache-2.0)
  if ($md -notmatch '(?m)^license:\s*') {
    $md = $md -replace '(?m)^(---\r?\n)', "`$1license: Apache-2.0`n"
  } elseif ($md -match '(?m)^license:\s*Complete terms') {
    $md = $md -replace '(?m)^license:\s*.+$', 'license: Apache-2.0'
  } elseif ($md -notmatch '(?m)^license:\s*(MIT|Apache-2\.0|Apache 2\.0|BSD|ISC|CC0|Unlicense)') {
    $md = $md -replace '(?m)^license:\s*.+$', 'license: Apache-2.0'
  }

  $dest = Join-Path $community $id
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $dest "SKILL.md"), $md)

  # Copia LICENSE.txt se existir
  if ($names -contains "LICENSE.txt") {
    $licRaw = "https://raw.githubusercontent.com/anthropics/skills/main/skills/$id/LICENSE.txt"
    try {
      $lic = Invoke-RestMethod -Uri $licRaw -Headers @{ Authorization = "Bearer $token"; "User-Agent" = "OntoomSkillCrawler/1.0" }
      [System.IO.File]::WriteAllText((Join-Path $dest "LICENSE.txt"), $lic)
    } catch {}
  }

  $promoted += [pscustomobject]@{
    id        = $id
    sourceUrl = "https://github.com/anthropics/skills/tree/main/skills/$id"
    license   = "Apache-2.0"
  }
  Write-Host "OK $id"
}

# NOTICE
$noticePath = Join-Path $root "NOTICE"
$notice = Get-Content $noticePath -Raw
foreach ($p in $promoted) {
  $line = "- $($p.id): Apache-2.0 — $($p.sourceUrl) (anthropics/skills)`n"
  if ($notice -notmatch [regex]::Escape($p.id)) {
    if ($notice -match 'None published yet') {
      $notice = $notice -replace '\(None published yet — add a line when promoting a community skill\.\)\r?\n', $line
    } else {
      $notice += $line
    }
  }
}
[System.IO.File]::WriteAllText($noticePath, $notice.TrimEnd() + "`n")

Write-Host "Promovidos: $($promoted.Count). Rode: npm run validate && npm run catalog:build"
