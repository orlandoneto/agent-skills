# Crawler Agent Skills — mapa para IAs

**Última revisão:** 2026-11-12 · versão package `0.6.0`

## Onde roda

| Ambiente | Quem dispara | Comando |
|----------|--------------|---------|
| **Produção** | GitHub Actions `crawl-daily` (2×/dia) | `npm run daily` |
| **Local (opcional)** | Dev | `npm run daily` ou `npm run discover` |

Não depende do PC do Orlando. Local = teste/forçar.

## Pipeline

```text
discover-repos  →  discovery-state.json + dynamic-sources.json
       ↓
crawl           →  staging/candidates-*.json  (policy ∪ dynamic)
       ↓
publish-safe    →  skills/community/ + catalog.json
       ↓
enrich-stars → catalog:build → crawl:summary → commit/Release → Ontoom
```

## Estado / “banco”

| Arquivo | Função |
|---------|--------|
| `staging/discovery-state.json` | Cache queries + repos vistos (evita busca repetida) |
| `staging/dynamic-sources.json` | Fontes novas mescladas no crawl |
| `catalog.json` fingerprints | Dedupe de skills publicadas |

**Postgres/Redis = futuro** (só se volume exigir). Hoje = JSON no Git, zero custo.

## O que não faz

- Google / scrape de SERP  
- Publicar sem gates (licença, scripts, score)  
- Hospedar ZIP na Vercel  

## Comandos úteis

```bash
npm run discover
npm run daily
SKIP_DISCOVER=1 npm run daily
npm test
```

Detalhe de gates: [QUALITY_GATES.md](./QUALITY_GATES.md).
