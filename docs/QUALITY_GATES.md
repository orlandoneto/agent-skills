# Quality gates — Agent Skills (Ontoom)

**Última revisão:** 2026-11-10  
**Canônico:** `policy.json` (este doc explica o porquê).

Crawler = **radar + rascunho**. Nunca espelho de milhares de skills.

## Riscos → controles

| Risco | Controle | Onde |
|-------|----------|------|
| Lixo em massa | `maxCandidatesPerDay`, score mínimo, só `published` no Ontoom/SEO | `policy.crawler` + `quality` |
| Licença | Allowlist; sem licença ⇒ `quarantine` | `policy.licenses` |
| Scripts maliciosos | `scripts/` ou binário ⇒ `review: manual`; auto-publish **proibido** | `policy.security` |
| ToS / rate limit | 1 pass/fonte/dia, User-Agent, allowlist de fontes, sem scrape livre | `policy.crawler` |
| Duplicata | Fingerprint = nome normalizado + hash do corpo | `policy.dedupe` |
| Espelho awesome | `forbiddenBehaviors` + `maxPublishedCommunity` | `policy.crawler` |

## Status no catalog

| Status | Significado | Aparece no Ontoom? |
|--------|-------------|--------------------|
| `staging` | Candidato do crawler / rascunho | Não |
| `quarantine` | Falhou licença ou suspeito | Não |
| `published` | Aprovado | Sim |
| `rejected` | Descartado | Não |

## Pipeline

```
fonte allowlist → collect (≤25/dia)
  → validate (SKILL.md, tamanho, name)
  → license gate
  → security gate (scripts?)
  → dedupe fingerprint
  → score
  → staging/candidates-*.json + PR
  → humano (ou promote só se score alto E sem scripts E autoPromote>0)
  → skills/community/ + catalog published
  → Release ZIP unitário
```

## Comandos

```bash
npm run validate          # todos os skills em skills/
npm run crawl             # escreve staging (não publica)
npm run promote -- <id>   # só se gates OK
npm run pack              # zips locais (CI faz no Release)
```

## Regra de ouro

Se a dúvida é “publico ou não?”, **não publique**. Quarentena > SEO poluído.

## Custo

Zero pago: GitHub público + Releases + Action free. Sem Meili/Algolia/VPS. Ontoom fica na **Vercel Hobby**. Ver rule `zero-custo` no repo ontoom.
