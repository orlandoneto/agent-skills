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

Repo **público** + Action **1×/dia** (`crawl-daily`, ~08:00 Brasília; também `workflow_dispatch`):

1. Varre fontes allowlist (ex.: Anthropic, Addy Osmani)  
2. `publish-safe` sobe skills SAFE em `skills/community/` + `catalog.json`  
3. Gera Release com **um ZIP por skill**  
4. [Ontoom /skills](https://www.ontoom.com.br/skills) lê o catalog e o download aponta para **este** GitHub público  

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
