---
license: MIT
name: stripe-subscription-lifecycle
description: Implements Stripe subscription flows end-to-end — checkout, webhook-driven state sync, cancellation, tier downgrades, and testing. Use when adding paid subscriptions to a new app, migrating from another billing system, or hardening an existing subscription flow that has drifted out of sync with Stripe.
---

# Stripe Subscription Lifecycle

Wire up Stripe subscriptions the way production apps actually need them — webhook-driven, idempotent, with a clean tier-downgrade story and a test plan.

## When to use

- Adding paid subscriptions to a new app.
- Migrating from Paddle, LemonSqueezy, Chargebee, etc. to Stripe.
- Hardening an existing Stripe integration where the app's state has drifted from Stripe's.
- Adding tier downgrades for non-payment or cancellation.

## Before you start

Know these:

1. **Pricing structure.** How many tiers? Monthly / yearly? Trials? Metered usage? Defines your Stripe Product + Price setup.
2. **Checkout flow.** Stripe Checkout (hosted, minimal code) or Payment Element (embedded, more control)? Default to Checkout unless you have a reason.
3. **What happens on cancellation.** End-of-period (user keeps access until the period ends) or immediate? Default end-of-period; users expect it.
4. **What happens on non-payment.** Grace period length, tier downgrade, data retention, account suspension.
5. **Which webhook events matter.** Full list is long; the 8–10 events that actually drive state are in the references.

## Authoring workflow

1. **Create Products and Prices in Stripe** (test mode). One Product per tier; one Price per billing interval. Store their IDs in config — never hardcode in app logic.
2. **Build the checkout flow.** `POST /create-checkout-session` on your backend returns a Stripe session URL; redirect the browser there.
3. **Build the webhook endpoint.** Verify the signature, handle events idempotently. See [webhook-setup.md](./references/webhook-setup.md).
4. **Build the subscription model** in your DB with the state machine from [subscription-states.md](./references/subscription-states.md).
5. **Wire up the lifecycle events** per [lifecycle-events.md](./references/lifecycle-events.md) — which event updates what.
6. **Add the Customer Portal** for self-service — pause, cancel, update card — so your support queue doesn't fill with billing requests.
7. **Test with the Stripe CLI** — trigger events locally, replay failures, rehearse cancellation flows. See [testing.md](./references/testing.md).

## Non-negotiable rules

- **Stripe is the source of truth for billing state, not your app.** Your DB mirrors Stripe via webhooks. Any divergence is a bug — and when debugging, trust Stripe.
- **Every webhook handler must be idempotent.** Stripe retries on 5xx, on timeout, on random network hiccups. Use the event ID as the idempotency key and no-op on duplicates.
- **Verify the webhook signature.** Unsigned webhooks are a critical vulnerability — any internet user can mint subscription events. Use `stripe.webhooks.constructEvent()` with the raw request body.
- **Serve the webhook endpoint with `express.raw()` — not `express.json()`.** Signature verification uses the byte-exact body. JSON parsing mutates it and verification silently fails.
- **Don't grant entitlements on checkout completion.** Wait for `customer.subscription.created` (or `invoice.paid`). The checkout session is an intent to pay, not proof of payment.
- **Store the Stripe customer ID and subscription ID on your user.** Reverse-lookup by email is fragile — users change emails, companies merge.
- **Never delete subscription records.** Mark them canceled / expired. You'll need the history for refunds, audits, and "why did I get charged" support tickets.
- **Tier downgrades are webhook-driven.** When the subscription ends or fails to renew, the `customer.subscription.deleted` / `invoice.payment_failed` event triggers the downgrade — not a cron job guessing at state.

## References

- [Webhook setup](./references/webhook-setup.md) — raw body parsing, signature verification, idempotency, the specific Express / Fastify gotchas.
- [Subscription states](./references/subscription-states.md) — all 7 Stripe subscription statuses, what each means, what transitions between them, which grants access.
- [Lifecycle events](./references/lifecycle-events.md) — the 8 events that drive state, what your handler does for each, common mistakes.
- [Testing](./references/testing.md) — Stripe CLI, `stripe listen`, `stripe trigger`, fixtures, test clocks for period-end scenarios.
