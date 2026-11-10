# Quality gates — Agent Skills (Ontoom)

**Última revisão:** 2026-11-10  
**Canônico:** `policy.json`

## Pipeline (o que o Orlando pediu)

```text
fontes allowlist (Git / seed)
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

## Custo

Zero pago: GitHub público + Releases + Action free. Ontoom = Vercel Hobby.
