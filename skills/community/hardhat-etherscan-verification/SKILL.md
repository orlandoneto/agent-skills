---
license: MIT
name: hardhat-etherscan-verification
description: Verifies a deployed Solidity contract on Etherscan (or any Etherscan-compatible explorer) via Hardhat's hardhat-verify plugin, with a manual Etherscan V2 API fallback for cases where the plugin fails. Use when a contract deploy needs verification, when automated verify fails with ABI/constructor/linking errors, or when a contract is flattened or uses custom compiler settings.
---

# Hardhat Etherscan Verification

Verify deployed contracts on Etherscan-compatible explorers. Handles the common case with the built-in plugin, and the painful edge cases via direct V2 API submission.

## When to use

- After deploying a contract and needing it verified on Etherscan, BaseScan, Arbiscan, PolygonScan, Optimism Etherscan, etc.
- When `npx hardhat verify` fails with obscure errors (constructor mismatch, bytecode mismatch, compiler version).
- For contracts you flattened before deploy (`hardhat flatten`), which the standard plugin handles poorly.
- For custom chains not in the built-in Hardhat config.

## Before you start

Collect:

1. **Deployed contract address** and the **chain** it's on.
2. **Constructor arguments** — the exact values passed when deploying.
3. **Compiler version and optimizer settings** used at deploy time. These must match bit-for-bit what you're submitting.
4. **API key** for the explorer (Etherscan, BaseScan, PolygonScan, etc.). Get one at the explorer's `my/apikey` page.
5. **Source files** — either the full `contracts/` tree, or a single flattened file.

## Workflow — automated path (hardhat-verify plugin)

1. Install and configure: `npm i -D @nomicfoundation/hardhat-verify`, import in `hardhat.config.ts`, add API keys per chain.
2. Run: `npx hardhat verify --network <net> <ADDRESS> "<arg1>" "<arg2>"`.
3. If it succeeds, you're done. Most of the time, it does.

See [automated-verify.md](./references/automated-verify.md) for config and common flags.

## Workflow — manual fallback (V2 API)

When the plugin fails, drop to the Etherscan V2 API directly. Use when:

- Plugin returns "bytecode does not match" despite correct compiler settings.
- Contract was deployed from a flattened source.
- Contract uses libraries or linked references that confuse the plugin.
- Explorer is a custom/new chain not supported by the plugin.

1. Flatten source (`npx hardhat flatten`) — produces a single `.sol` with all imports inlined.
2. Strip duplicate `SPDX-License-Identifier` and `pragma` lines that flatten emits (they break V2 parsing).
3. ABI-encode constructor args with `cast abi-encode` or an equivalent.
4. POST to `https://api.etherscan.io/v2/api?chainid=<CHAIN>` with `action=verifysourcecode`, the flattened source, compiler version, optimizer runs, and encoded args.
5. Poll `action=checkverifystatus` with the returned GUID every ~15 seconds until success or failure.

See [manual-v2-api.md](./references/manual-v2-api.md) for the full POST body, field reference, and a TypeScript script.

## Non-negotiable rules

- **Compiler version match is exact.** `0.8.24` ≠ `0.8.25`. `optimizer=true, runs=200` ≠ `optimizer=true, runs=1000`. The deploy config and the verify submission must match down to each byte of metadata.
- **Constructor args are the #1 cause of "bytecode mismatch."** Print the exact values you deployed with and pass them identically. ABI-encode with the contract's constructor signature, not a guess.
- **Pin the explorer URL per chain.** `api.etherscan.io` is Ethereum mainnet/Sepolia. `api.basescan.org`, `api.arbiscan.io`, `api.polygonscan.com` are separate hosts — using the wrong one returns "OK" but never verifies.
- **Never commit your explorer API key.** Use `.env`; include a `.env.example` with the var name.
- **Don't re-flatten between deploy and verify.** If you flattened before deploy, verify the exact flattened file you deployed from. Re-flattening produces slightly different output (comment ordering, whitespace) and fails the match.

## References

- [Automated verify (plugin path)](./references/automated-verify.md) — `@nomicfoundation/hardhat-verify` config, per-chain API keys, common flags and flags-that-lie.
- [Manual V2 API fallback](./references/manual-v2-api.md) — field-by-field walk-through of the POST body, a TypeScript submission script, and the polling loop.
- [Troubleshooting](./references/troubleshooting.md) — "bytecode mismatch" decoded, constructor arg gotchas, library linking, chain-specific weirdness.
