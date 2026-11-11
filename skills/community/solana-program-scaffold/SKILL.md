---
license: MIT
name: solana-program-scaffold
description: Scaffolds a Solana on-chain program with Anchor — workspace setup, PDA patterns, dual SOL/SPL token support, constraint-driven validation, on-chain randomness via SlotHashes, testing with the TypeScript Anchor client, and mainnet deployment. Use when starting a new Solana program, adding a new instruction to an existing one, or standardizing an ad-hoc Anchor project.
---

# Solana Program Scaffold

Bootstrap an Anchor-based Solana program with current conventions. Covers workspace layout, PDA derivation, SOL-vs-SPL dual instruction patterns, `#[derive(Accounts)]` constraints, testing, and deployment.

## When to use

- Starting a new Solana program from scratch.
- Adding instructions to an existing Anchor program and wanting a consistent account/PDA/testing pattern.
- Standardizing a quick-prototype program that has drifted.
- Migrating a native Rust program to Anchor (or vice versa — but almost always prefer Anchor).

## Before you start

Decide:

1. **Anchor vs native Rust.** Default to **Anchor 0.31+**. Native Rust is only worth it for extreme byte-level optimization or when Anchor's IDL constraints don't fit. This skill assumes Anchor.
2. **SOL, SPL, or both?** Programs that accept value typically need both a SOL flow and an SPL flow. Anchor encourages these as **parallel instruction variants** (`place_bet_sol` / `place_bet_spl`) rather than a single polymorphic instruction.
3. **PDA strategy.** Which accounts are PDAs? What seeds identify them? Common patterns: singleton (`[b"factory"]`), indexed (`[b"item", counter.to_le_bytes()]`), per-user (`[b"user_account", user.key().as_ref()]`).
4. **Randomness source.** If the program needs randomness, decide now: SlotHashes sysvar (provably fair, cheap, manipulable by validators within a slot), Switchboard VRF (true randomness, paid), or commit-reveal (no extra deps, but requires two transactions).
5. **Testing model.** Anchor's default is TypeScript/Mocha via `anchor test`. Good for integration-level. For Rust-native unit tests, add a `tests/` Cargo target. [LiteSVM](https://github.com/LiteSVM/litesvm) / Bankrun give much faster in-memory testing than the built-in `solana-test-validator`.

## Authoring workflow

1. **Init the workspace.** `anchor init my-program` gives you `programs/`, `tests/`, `Anchor.toml`. Commit the scaffold before writing anything.
2. **Decide your account types first** — `#[account]` structs in `src/state.rs`. Every PDA stores its own `bump` for safe re-derivation.
3. **Write instructions as modules** under `src/instructions/`. One file per instruction. Each exports an `Accounts` struct and a handler function.
4. **Register instructions in `lib.rs`** inside the `#[program]` module. Keep `lib.rs` as a dispatch table — no business logic here.
5. **Custom errors** in `src/errors.rs` via `#[error_code]`. Reference them inline in constraints: `constraint = cond @ MyError::Variant`.
6. **Tests** in `tests/` — TypeScript via the Anchor client, with the IDL loaded from `target/idl/<program>.json`.
7. **Deployment** — `anchor build`, verify binary size, deploy with `solana program deploy` or `anchor deploy`. For mainnet, transfer upgrade authority to a multisig / hardware wallet after initial deploy.

## Non-negotiable rules

- **Every PDA stores its `bump`** on its account and re-derives with that exact bump. Never re-derive a PDA without storing the bump — it's expensive and error-prone.
- **Every account constraint in `#[derive(Accounts)]` has an attributed error.** `constraint = foo == bar @ MyError::NotBar` — not bare `constraint = foo == bar`. Unattributed constraints produce opaque `ConstraintRaw` errors that are miserable to debug.
- **Dual SOL/SPL instructions stay parallel, not unified.** If your program accepts both, keep `place_bet_sol` and `place_bet_spl` as separate instructions with separate account contexts. A single polymorphic instruction that branches on `mint == Pubkey::default()` looks cleaner but breaks Anchor's type guarantees.
- **`owner` checks are constraints, not runtime `if` statements.** Put them in `#[derive(Accounts)]`, not in the handler body.
- **Never use `Clock::get()?.unix_timestamp` or `block.timestamp`-equivalent as randomness.** Use SlotHashes sysvar or Switchboard VRF.
- **Sign your deployment transactions with a local keypair you keep offline** for mainnet. `--keypair ~/.config/solana/id.json` for devnet is fine; a production upgrade authority should be a hardware wallet or multisig.
- **Binary size matters.** `target/deploy/<program>.so` over ~200 KB risks hitting per-slot compute limits and incurs painful rent. Strip with `RUSTFLAGS="-C strip=symbols"` if you're close.

## References

- [Anchor workspace setup](./references/anchor-setup.md) — init, `Cargo.toml` features, `Anchor.toml`, `lib.rs` shape.
- [PDA patterns](./references/pda-patterns.md) — singleton, indexed, per-user, vault PDAs; storing and verifying bumps.
- [Accounts and constraints](./references/accounts-and-constraints.md) — `#[derive(Accounts)]` attributes, constraint-with-error pattern, ownership + state validation.
- [SOL vs SPL token flows](./references/sol-vs-spl.md) — why they're parallel, how to structure vault PDAs for SPL, mint discrimination.
- [On-chain randomness](./references/randomness.md) — SlotHashes sysvar pattern, limitations, when to use Switchboard VRF instead.
- [Testing with the TypeScript Anchor client](./references/testing.md) — IDL-based client, PDA derivation from TS, smoke tests vs unit tests, LiteSVM alternative.
- [Deployment and upgrade authority](./references/deployment.md) — build → verify size → deploy → initialize → transfer authority.
