---
license: MIT
name: evm-contract-scaffold
description: Scaffolds a Solidity smart contract project — Foundry-first with Hardhat alternative, OpenZeppelin-based token patterns (ERC-20/721/1155), testing, and deployment. Use when starting a new Solidity project, standardizing an existing one, adding a new contract to an existing repo, or migrating from Hardhat to Foundry (or back).
---

# EVM Contract Scaffold

Bootstrap a Solidity smart contract project with current tooling. Covers project layout, toolchain choice, standard token contracts, test setup, and deployment.

## When to use

- Starting a new Solidity project from scratch.
- Adding a new contract to an existing repo that already has a toolchain.
- Migrating from Hardhat to Foundry (or back).
- Standardizing an ad-hoc project that was set up quickly and has drifted.

## Before you start

Decide:

1. **Toolchain**. Foundry (Rust-based, fast, Solidity-native tests) or Hardhat (TypeScript-first, large plugin ecosystem). Default to **Foundry** unless the team is heavily TypeScript-native and leans on specific Hardhat plugins (verification, upgrades, TypeChain).
2. **Token standard**, if any. ERC-20, ERC-721, ERC-1155, or non-token custom logic.
3. **Solidity version**. `^0.8.24` is a safe default. Pin a specific version rather than a caret if you're shipping to production.
4. **Networks**. Which chains deploy to? This drives the config file (Foundry's `foundry.toml` or Hardhat's `hardhat.config.ts`).
5. **Upgradeability**. Proxy (UUPS / Transparent) or immutable? If upgradeable, use OpenZeppelin's `@openzeppelin/contracts-upgradeable` and plan the initializer from day one.

## Authoring workflow

1. **Init the project** (Foundry: `forge init`, Hardhat: `npx hardhat init`). Commit the default scaffold before writing your contract — makes the diff clean.
2. **Install OpenZeppelin** and lock its version. Never hand-write ERC standards.
3. **Write the contract** starting from the nearest OZ preset — `ERC20`, `ERC721`, `ERC1155`, `Ownable`, `AccessControl`. Override only what you need.
4. **Write tests before deploying anywhere.** Foundry: `.t.sol`. Hardhat: `test/*.ts` with `ethers` + `chai`.
5. **Add a deployment script.** Foundry: `script/*.s.sol`. Hardhat: `scripts/deploy.ts`. Include constructor args handling.
6. **Add verification.** Foundry: `forge verify-contract`. Hardhat: `@nomicfoundation/hardhat-verify`. See the companion skill `hardhat-etherscan-verification` for the fallback V2 API flow when automated verify fails.
7. **Run gas snapshot**: Foundry's `forge snapshot` or Hardhat's `hardhat-gas-reporter`. Commit the baseline so future PRs surface regressions.

## Non-negotiable rules

- **Always inherit from OpenZeppelin for token standards.** Hand-rolled ERC-20/721/1155 is a security risk and a maintenance burden. Unless you're implementing a novel standard, you should not be writing `transfer` yourself.
- **Lock the Solidity compiler version** in the `pragma` line and in `foundry.toml` / `hardhat.config.ts`. `pragma solidity ^0.8.24` compiles fine across minor versions — but deploying with different compiler versions across environments causes subtle bytecode differences and audit headaches.
- **Tests live next to code** in Foundry (`src/Foo.sol` + `test/Foo.t.sol`). Hardhat's convention is a separate `test/` tree. Pick one and stay consistent.
- **Never commit private keys.** Use `.env` + `--account` in Foundry or `PRIVATE_KEY` env var in Hardhat. `.env` in `.gitignore` with a committed `.env.example`.
- **Custom errors over revert strings** — `error NotOwner();` instead of `require(..., "not owner")`. Cheaper gas, better tooling, better frontend decoding.
- **Events for every state change.** Frontends, indexers, and audits all rely on them.
- **Access control is not optional.** `Ownable` for simple cases, `AccessControl` with roles for anything multi-party. No `onlyOwner` equivalent written from scratch.
- **No `tx.origin` for authorization.** Ever. Use `msg.sender`.

## References

- [Project setup — Foundry and Hardhat side by side](./references/project-setup.md) — init commands, file tree, config files, how to choose.
- [Standard contract patterns](./references/standard-patterns.md) — OpenZeppelin-based templates for ERC-20, ERC-721, ERC-1155, Ownable, AccessControl, upgradeability.
- [Testing](./references/testing.md) — Foundry fuzzing, invariants, forking; Hardhat with TypeScript + chai; coverage and gas snapshots.
- [Deployment and verification](./references/deployment.md) — deploy scripts, constructor args, verification flow, multi-network configuration.
- [Gas and optimization awareness](./references/gas.md) — when to optimize, what to check, common gas traps (storage slots, `string` vs `bytes`, loops over unbounded arrays).
