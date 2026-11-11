# Quality gates — Agent Skills (Ontoom)

**Última revisão:** 2026-11-11  
**Canônico:** `policy.json`

## Pipeline (o que o Orlando pediu)

```text
fontes allowlist (Git / seed) — inclui `addyosmani/agent-skills` + `anthropics/skills`
  → npm run crawl          → staging/candidates-*.json
  → npm run publish-safe   → skills/community/ + catalog.json  (SAFE only)
  → git push
  → npm run pack + Release → ZIP unitário por skill
  → Ontoom /skills lê catalog.json → botão Baixar funciona
```

SAFE auto-publish (`maxAutoPromotePerDay`, default **10**):

- licença na allowlist (MIT/Apache/…)
- **sem** pasta `scripts/`
- score ≥ `minScoreToPublish`
- não duplicata (fingerprint)
- abaixo de `maxPublishedCommunity`

Com `scripts/` → **não** auto-publica (fica rejected/held para review manual).

## Riscos → controles

| Risco | Controle |
|-------|----------|
| Lixo em massa | teto/dia + score + só `published` no Ontoom |
| Licença | allowlist |
| Scripts | nunca auto-publish |
| Rate limit / ToS | 1 pass/fonte/dia, User-Agent, allowlist |
| Duplicata | fingerprint |
| Download | ZIP no **GitHub Release** (não Vercel) |
| Link "Ver no GitHub" | Sempre espelho `orlandoneto` se publicado em `skills/`; `sourceUrl` = crédito ao autor |

## Status

| Status | Ontoom? |
|--------|---------|
| `published` (catalog) | Sim |
| staging / rejected | Não |

## Comandos

```bash
npm run crawl
npm run publish-safe
npm run catalog:build
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

Prova visual: Actions verde + `at` recente em `staging/last-crawl.json` + resumo do dia.

### Fontes

Só **`policy.json` → `sourcesAllowlist`** (GitHub repos com `skills/`).  
**Não** há busca Google / scrap de “awesome list” — novas fontes entram na allowlist com o Orlando.

Repos atuais: Anthropic, Addy Osmani, Vercel Labs, Solonnikov, Prompting Company (+ seed local).

## Custo

Zero pago: GitHub público + Releases + Action free. Ontoom = Vercel Hobby.
