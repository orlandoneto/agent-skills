---
license: MIT
name: wagmi-contract-interaction
description: Reads, writes, and watches EVM smart contracts using wagmi v2 with typed ABIs — simulate/write/receipt pattern, event subscription, and chain-aware error handling. Use when integrating a contract into a frontend, adding a new write flow, extending read calls, or hardening an existing contract interaction against reverts and user rejection.
---

# Wagmi Contract Interaction

Integrate EVM smart contracts into a web frontend using [wagmi](https://wagmi.sh) v2 + [viem](https://viem.sh). Covers typed ABIs, the simulate → write → wait pattern, batch reads, event subscriptions, and error handling.

## When to use

- Adding a smart contract to a new or existing frontend.
- Adding a new write flow to an app that already reads from a contract.
- Replacing `ethers@5` or raw `window.ethereum` calls with type-safe wagmi calls.
- Hardening a contract integration against reverts, user rejection, and insufficient funds.

## Before you start

Collect:

1. **Contract address** per chain. Hard-code in config, never in user-visible input.
2. **ABI.** Prefer the JSON artifact emitted by your compiler over a hand-written one. Use `wagmi/cli` with `@wagmi/cli/plugins` to generate typed `useReadContract` / `useWriteContract` hooks.
3. **Chain IDs.** Which chains does this contract live on?
4. **Wagmi config.** The app must already have a `createConfig(...)` and `WagmiProvider` at the root. If not, wire that first.

## Authoring workflow

1. **Generate typed bindings** with `wagmi/cli` and commit them alongside the ABI. This is the biggest correctness win — typed reads/writes catch ABI drift at build time.
2. **Reads** — use `useReadContract` (React hook) or `readContract` (imperative) for single calls. Use `useReadContracts` for batched reads; the RPC call count goes from N to 1.
3. **Writes** — always follow **simulate → write → wait**:
   1. `useSimulateContract` / `simulateContract` — catches reverts client-side before the user signs.
   2. `useWriteContract` / `writeContract` — triggers the wallet signature.
   3. `useWaitForTransactionReceipt` / `waitForTransactionReceipt` — confirms the transaction landed with `status === 'success'`.
4. **Events** — use `useWatchContractEvent` for live subscriptions, `getContractEvents` (imperative) for historical queries.
5. **Errors** — branch on error shape: `UserRejectedRequestError`, `InsufficientFundsError`, `ContractFunctionRevertedError`. Surface human-readable messages, not raw hex.
6. **Chain check** — before any write, verify the user is on the expected `chainId`. If not, prompt `switchChain` and abort the write until they're on the right chain.

## Non-negotiable rules

- **Never build a contract write from user input without validation.** Amounts go through `parseEther` / `parseUnits`, addresses through `isAddress`, never `Number * 1e18` or raw string concatenation.
- **Always simulate before writing.** `simulateContract` reproduces the call on the RPC and surfaces reverts before the user signs a doomed transaction (and pays gas for it).
- **Always wait for the receipt.** A returned tx hash means the transaction was broadcast, not that it succeeded. Check `receipt.status`.
- **Never store ABIs by URL.** Import them from the codebase so version and content are fixed at build time.
- **Gas estimation has a fallback.** Wagmi estimates gas automatically, but on some RPCs it fails mid-write. Catch that specific path and retry with a manual `gas` override rather than failing the whole flow.
- **User rejection is not an error to report.** Treat `UserRejectedRequestError` as a cancelled action, not a crash. No toast, no Sentry.

## References

- [Setup and typed ABIs](./references/setup.md) — wagmi config, `wagmi/cli` generation, where bindings live in the tree.
- [Read patterns](./references/reads.md) — single reads, batched reads, conditional reads, watch-mode reads.
- [Write patterns](./references/writes.md) — the simulate → write → wait flow, optimistic UI, duplicate-submit prevention.
- [Event subscriptions](./references/events.md) — live watchers, historical `getContractEvents` with pagination, decoding logs.
- [Error handling](./references/errors.md) — wagmi error classes, how to decode revert reasons, what to show the user.
