# Ontoom Agent Skills

Catálogo **curado** de [Agent Skills](https://agentskills.io) (Cursor, Claude Code, Codex, Gemini CLI, …).

**Este repositório é público** — código, `catalog.json`, Releases e ZIPs abertos.  
**Catálogo no site:** [www.ontoom.com.br/skills](https://www.ontoom.com.br/skills)

Tem **crawler diário** (GitHub Action): varre fontes allowlist, promove skills SAFE e atualiza o buscador + Releases.

## Como baixar (um skill só)

Não clone o monorepo para pegar um skill.

1. Abra o skill no [Ontoom](https://www.ontoom.com.br/skills) **ou** na Release
2. Baixe o ZIP **daquele** skill
3. Extraia em `.agents/skills/<nome>/` (ou `.claude/skills/`, `.cursor/skills/`)

Se este repo te ajudou, deixe uma ⭐ — ajuda outros a achar.

## Layout

```
skills/ontoom/       # originais Ontoom
skills/community/    # aprovados (com crédito + licença)
staging/             # crawler (nunca é o catálogo público)
policy.json          # gates anti-lixo / licença / scripts / dedupe
catalog.json         # índice consumido pelo Ontoom
```

## Crawler → Git + buscador (público)

Repo **público** + Action diária com **garantia** (`crawl-daily` + `crawl-watchdog`):

| Camada | O que faz |
|--------|-----------|
| Cron 08:00 BRT | Crawl + publish-safe + heartbeat |
| Cron 17:00 BRT | Backup se o GitHub pular o primeiro |
| Heartbeat | `staging/last-crawl.json` commitado **todo** run (prova) |
| Resumo | `staging/crawl-summary-YYYY-MM-DD.md` (novos + datas) |
| Watchdog 19:00 BRT | Se >26h sem sucesso → re-dispara + abre Issue |
| Falha do crawl | Abre Issue automaticamente |
| Manual | Actions → `crawl-daily` → **Run workflow** |
| Fontes | Só allowlist em `policy.json` (sem Google / scrape aberto) |
| Pipeline | `npm run daily` — crawl com retry + publish + stars + summary |
| Sync Ontoom | Action dispara `sync-skills-catalog` no repo ontoom |

1. Varre fontes allowlist (ex.: Anthropic, Addy Osmani)  
2. `publish-safe` sobe skills SAFE em `skills/community/` + `catalog.json`  
3. Gera Release com **um ZIP por skill** (só se o catálogo mudou)  
4. [Ontoom /skills](https://www.ontoom.com.br/skills) lê o catalog e o download aponta para **este** GitHub público  

Confira o último run: [Actions / crawl-daily](https://github.com/orlandoneto/agent-skills/actions/workflows/crawl-daily.yml) · heartbeat: [`staging/last-crawl.json`](./staging/last-crawl.json)

Nada de repositório privado: quem baixa, estrela e inspeciona o código usa este repo aberto.

## Gates (obrigatório)

Ver [docs/QUALITY_GATES.md](./docs/QUALITY_GATES.md).

- Sem licença allowlist → não publica  
- `scripts/` → **não** auto-publish  
- Duplicata por fingerprint → rejeita  
- Teto `maxAutoPromotePerDay` (default 10)  

```bash
npm test
npm run crawl
npm run publish-safe   # Git + catalog (buscador)
npm run pack           # ZIP por skill
```

## Licença

MIT para skills Ontoom. Community: ver `NOTICE` + campo `license` de cada entrada.
