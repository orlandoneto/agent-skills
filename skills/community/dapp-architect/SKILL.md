---
license: MIT
name: dapp-architect
description: Designs decentralized apps from brief to production — user + trust-boundary mapping, contract architecture, client layer, indexing strategy, off-chain components, deployment pipeline, and ops. Use when starting a new dApp and needing a coherent plan before code, auditing an existing dApp for architectural gaps, or teaching a team to think through dApp design instead of stumbling into it.
---

# dApp Architect

End-to-end design playbook for decentralized apps. Bigger than "how to deploy a contract" or "how to integrate wagmi" — this is about how the pieces fit together into something operable.

## When to use

- Starting a new dApp and needing a coherent plan before the first PR.
- Reviewing an existing dApp for architectural gaps — missing indexing, fragile deploys, no off-chain fallbacks, observability blind spots.
- Teaching a team to think through design holistically instead of stumbling into pieces.
- Preparing an RFC / grant proposal / pitch deck where architecture credibility matters.

## Before you start

The architect's first job is to establish what's actually being built. These must be pinned down before architecture:

1. **The problem in one sentence.** If you can't state it, there isn't a dApp yet — keep iterating on the brief.
2. **The user.** Who are they. What wallet. What chain. What device. Technical literacy.
3. **The economic model.** Who pays for what — gas, platform fees, subscriptions, mint costs, rev share.
4. **The trust assumptions.** What's on-chain because it must be trustless. What's off-chain because it'd be absurd on-chain.
5. **Timeline and team.** What's shippable in 3 months with 2 engineers vs 12 months with 8. Architecture scales to team size, not ambition.

Without these, architecture is fiction.

## The 6-phase workflow

The phases are sequential but iterative. Expect to loop back. Don't rush past an unresolved phase.

1. **Brief → spec.** Turn a vague idea into a buildable document. [brief-to-spec.md](./references/brief-to-spec.md)
2. **Users → trust boundaries.** Map who does what and where the trust line sits. Everything downstream follows. [trust-boundaries.md](./references/trust-boundaries.md)
3. **Contract layer.** What contracts exist, how they relate, upgrade strategy, event design, interfaces to the rest of the system. [contract-layer.md](./references/contract-layer.md)
4. **Client layer.** Frontend, wallet integration, state, caching, error UX, multi-chain handling. [client-layer.md](./references/client-layer.md)
5. **Indexing + events.** How the world reads your chain state. Subgraph, custom indexer, direct RPC — when each is right. [indexing-and-events.md](./references/indexing-and-events.md)
6. **Off-chain services.** Backend, keepers, notifications, Discord/social layer — when you need each. [off-chain-services.md](./references/off-chain-services.md)
7. **Deployment + ops.** Local → testnet → mainnet. Upgrades, multi-chain, observability, incident runbooks. [deployment-and-ops.md](./references/deployment-and-ops.md)

(Yes, that's 7 phases. Brief → spec sits as phase 0 in most teams' minds; numbering them 1–7 is clearer for review.)

## Non-negotiable rules

- **Decide trust boundaries before writing any code.** Every on-chain piece of state is expensive; every off-chain piece requires trust in operators. Pick deliberately.
- **Design events before functions.** Indexers, bots, and frontends all consume events. Bad event design cascades across everything downstream.
- **Assume RPCs fail.** A dApp that breaks when Alchemy blips isn't a dApp — it's a fair-weather demo. Plan for fallback RPCs or degraded modes.
- **Index the minimum, at the latest moment you can.** Over-indexing hurts ops and cost; under-indexing hurts UX. Find the specific line per use case.
- **Upgradeability is a cost, not a feature.** Upgradeable contracts need storage discipline, timelock governance, and audit on every upgrade. Default immutable; opt into upgradeable only when there's a specific reason.
- **Multi-chain is a product decision, not a technical one.** Every extra chain doubles ops work. Add chains only when users actually need them.
- **Testnet is a lie.** Behavior on mainnet differs — MEV, gas, rent, validator behavior. Plan a "mainnet beta" phase before general release.
- **Observability ships with the first contract.** You should know within 60 seconds if contracts start reverting, if RPCs slow, if the indexer lags. Retrofitting observability is always harder than shipping it.
- **Design for rollback.** Every deploy has a plan B. Every contract has a circuit breaker or a migration path. Every frontend has a feature flag.

## References

- [Brief → spec](./references/brief-to-spec.md) — turning an idea into a buildable document. Questions to ask, gaps to surface, artifacts to produce.
- [Trust boundaries](./references/trust-boundaries.md) — who trusts what. The map that drives every downstream architecture decision.
- [Contract layer](./references/contract-layer.md) — what contracts exist, upgrade strategy, factory/registry patterns, event design, interfaces to the rest of the system.
- [Client layer](./references/client-layer.md) — frontend, wallet integration, state management, caching, error UX, multi-chain handling.
- [Indexing + events](./references/indexing-and-events.md) — how to read on-chain state. Subgraph vs custom indexer vs RPC polling. Real-time vs historical. Backfill.
- [Off-chain services](./references/off-chain-services.md) — backend, keepers, notification systems, Discord/social layer. When each is needed and when it isn't.
- [Deployment + ops](./references/deployment-and-ops.md) — local → testnet → mainnet. Upgrades, multi-chain coordination, observability, incident runbooks.
