# Ontoom Agent Skills

Catálogo **curado** de [Agent Skills](https://agentskills.io) (Cursor, Claude Code, Codex, Gemini CLI, …).

**Catálogo no site:** [www.ontoom.com.br/skills](https://www.ontoom.com.br/skills)

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

## Gates (obrigatório)

Ver [docs/QUALITY_GATES.md](./docs/QUALITY_GATES.md).

- Sem licença allowlist → quarentena  
- `scripts/` → review manual  
- Duplicata por fingerprint → rejeita  
- Crawler ≤ N candidatos/dia → **não** espelha awesome inteiro  

```bash
npm test          # validate + unit
npm run crawl     # só staging
npm run promote -- <id>
npm run pack      # ZIP por skill em dist/zips/
```

## Licença

MIT para skills Ontoom. Community: ver `NOTICE` + campo `license` de cada entrada.
