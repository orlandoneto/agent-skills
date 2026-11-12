# Quality gates — Agent Skills (Ontoom)

**Última revisão:** 2026-11-12  
**Canônico:** `policy.json`

## Pipeline (o que o Orlando pediu)

```text
descoberta GitHub (Search) → staging/discovery-state.json + dynamic-sources.json
fontes = policy.sourcesAllowlist ∪ dynamic-sources
  → npm run crawl          → staging/candidates-*.json
  → npm run publish-safe   → skills/community/ + catalog.json  (SAFE only)
  → git push
  → npm run pack + Release → ZIP unitário por skill
  → Ontoom /skills lê catalog.json → botão Baixar funciona
```

SAFE auto-publish (`maxAutoPromotePerDay`, default **250** em policy):

- licença na allowlist (MIT/Apache/…)
- **sem** pasta `scripts/`
- score ≥ `minScoreToPublish`
- não duplicata (fingerprint)
- abaixo de `maxPublishedCommunity`

Com `scripts/` → **não** auto-publica (fica rejected/held para review manual).

## Descoberta inteligente (sem Google)

| Peça | Papel |
|------|--------|
| `npm run discover` | GitHub Search (code + repos) → novos repos com `skills/` |
| `staging/discovery-state.json` | Cache de queries/páginas/repos já vistos (JSON no Git) |
| `staging/dynamic-sources.json` | Allowlist dinâmica mesclada no crawl |
| Recheck | Repos `dynamic`/`exhausted` só reinspecionam a cada `recheckDays` (7) |

**Proibido:** scrape Google/SERP, espelhar awesome inteiro, publicar sem gates.  
**Futuro (não agora):** Postgres/Redis se o volume de estado exigir — hoje JSON no repo basta (zero custo).

## Riscos → controles

| Risco | Controle |
|--------|----------|
| Lixo em massa | teto/dia + score + só `published` no Ontoom |
| Licença | allowlist (policy + SPDX do repo na discovery) |
| Scripts | nunca auto-publish |
| Rate limit / ToS | páginas/query/dia, User-Agent, pausa entre searches |
| Duplicata | fingerprint + discovery-state |
| Download | ZIP no **GitHub Release** (não Vercel) |
| Link "Ver no GitHub" | Sempre espelho `orlandoneto` se publicado em `skills/`; `sourceUrl` = crédito ao autor |

## Status

| Status | Ontoom? |
|--------|---------|
| `published` (catalog) | Sim |
| staging / rejected / discovery | Não |

## Comandos

```bash
npm run discover      # Fase A — novos repos → dynamic-sources
npm run crawl
npm run publish-safe
npm run catalog:build
npm run daily         # discover + crawl retry + publish + stars + summary
npm test
npm run pack
```

## Garantia diária (crawler)

O `schedule` do GitHub **pode atrasar ou pular** um dia. Por isso:

1. **Dois crons** em `crawl-daily` (11:00 e 20:00 UTC ≈ 08:00 e 17:00 BRT)
2. **Heartbeat** `staging/last-crawl.json` em todo run bem-sucedido
3. **`crawl-watchdog`** às 22:00 UTC: se último sucesso >26h → `workflow_dispatch` do crawl + Issue
4. Falha do crawl → Issue automática
5. **Resumo** `staging/crawl-summary-YYYY-MM-DD.md` + Step Summary (novos, skipped, datas `addedAt`)
6. **`npm run daily`** — discover + crawl com até 3 retries + publish + `enrich-stars` + summary; Action dispara sync no Ontoom

Prova visual: Actions verde + `at` recente em `staging/last-crawl.json` + resumo do dia.

### Fontes

1. **`policy.json` → `sourcesAllowlist`** (estáticas, curadas)  
2. **`staging/dynamic-sources.json`** (descobertas via GitHub Search)  
3. **`staging/seed-sources.json`** (seed manual de skills unitárias)

Fontes estáticas atuais: Anthropic, Addy Osmani, Vercel Labs, Solonnikov, Prompting Company, packs marketing (coreyhaines / AgriciDaniel / kostja94 / aaron), **notque/vexjoy-agent**, **davila7/claude-code-templates** (business-marketing + development), **ckorhonen/claude-skills** (+ seed local).

Import em massa (clone git, sem Contents API): `npm run import:marketing` (só novos; `IMPORT_ALL=1` reimporta packs).

## Custo

Zero pago: GitHub público + Releases + Action free. Ontoom = Vercel Hobby.  
Banco grande (Postgres/Redis) = **futuro**, só se o JSON ficar inviável.
