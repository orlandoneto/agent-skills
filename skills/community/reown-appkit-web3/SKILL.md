---
license: MIT
name: reown-appkit-web3
description: Integrates @reown/appkit multi-chain wallet connections (EVM via wagmi, Solana, Bitcoin) into a web app — initialization, network configuration, connection state, and transaction flows. Use when adding wallet connect support to a new app, extending an existing app to a new chain family, or standardizing wallet state management.
---

# Reown AppKit Web3 Integration

End-to-end guide for wiring `@reown/appkit` into a web app with wagmi (EVM), Solana, and Bitcoin adapters.

## When to use

- Adding a "Connect Wallet" flow to a new app.
- Extending an existing EVM-only app to support Solana or Bitcoin.
- Consolidating ad-hoc ethers/web3 code behind a single AppKit abstraction.
- Standardizing wallet state management in a framework-agnostic or framework-idiomatic way.

## Before you start

Collect:

1. **Reown project ID** — get one at https://cloud.reown.com. Required; AppKit will not initialize without it.
2. **Chain families** — which of EVM / Solana / Bitcoin do you need? Each adds a dependency and increases bundle size.
3. **Target networks** — mainnet only, or testnets too? Which L2s?
4. **State home** — plain service, framework store (NgRx, Redux, Zustand, Pinia), or component-store. This skill is framework-agnostic; the patterns below work anywhere.
5. **Allowed/featured/excluded wallets** — UX decision, not technical.

## Install

```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi @reown/appkit-adapter-solana @reown/appkit-adapter-bitcoin wagmi viem @solana/web3.js
```

Drop adapters you don't need.

## Authoring workflow

1. Build a single wallet state module (service, store, or hook) that owns:
   - `modal` (the AppKit instance)
   - `wagmiConfig` (if using EVM)
   - Connection state: `isConnected`, `address`, `chainId`, `walletInfo`
2. In an init method, construct each adapter, pass them all to `createAppKit`, and subscribe to state + event streams.
3. On every subscription tick, **normalize** the CAIP-formatted address into `{ type, chainId, address }` and update your state.
4. Expose a minimal API to the rest of the app: `connect()`, `disconnect()`, and reactive `connectionState`. Nothing else touches AppKit directly.
5. On disconnect, tear down subscriptions and reset state — including any chain-specific listeners (Phantom, Xverse, etc.) you attached outside AppKit.

## Non-negotiable rules

- **Project ID is not a secret, but it is environment-specific.** Use different IDs for dev / staging / prod and load from config, never hard-code.
- **One AppKit instance per session.** Creating a second `createAppKit` call leaks listeners and corrupts state. If you need to reconfigure (e.g. switch networks), tear down and rebuild.
- **Never trust client-side signature verification.** Any signed message used for auth MUST be verified server-side with nonce + chain ID + domain replay protection.
- **Normalize CAIP addresses before use.** AppKit exposes addresses in CAIP format (`eip155:<chainId>:0x...`, `solana:...`, `bip122:...`). Parse them into typed fields before storing or displaying.
- **Wallet address is user-facing.** Always display with checksumming (EVM) or the wallet's canonical format. Never echo back raw user input as a wallet address.
- **Reconcile on mount, don't assume.** On app load, check AppKit's current state rather than assuming disconnected — users refresh, wallets auto-reconnect.
- **Log wallet events to your analytics with care.** `address` is personally identifiable; follow your privacy policy.

## References

- [Initialization and adapter configuration](./references/initialization.md) — code for constructing wagmi/Solana/Bitcoin adapters and `createAppKit`.
- [Networks and chain IDs](./references/networks.md) — CAIP format, supported networks, how to pick a subset.
- [Connection state management](./references/state.md) — subscribing to AppKit state, wagmi watchers, Phantom-native listeners, state shape.
- [Signing and transactions](./references/transactions.md) — signMessage, sendTransaction, and the SIWE/SIWS verification handshake.
- [Security checklist](./references/security.md) — frontend threats and mitigations for wallet + payment flows.
