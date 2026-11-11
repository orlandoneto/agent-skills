---
license: MIT
name: ngrx-feature-scaffold
description: Scaffolds a complete NgRx feature module (actions, reducer, effects, selectors, facade, models, tests) using modern Angular patterns. Use when adding a new feature slice to an Angular + NgRx app, standardizing existing ad-hoc state code, or bootstrapping state for a new library in an Nx monorepo.
---

# NgRx Feature Scaffold

Generate a coherent NgRx feature slice that follows current best practices:

- `createActionGroup` with event-style action names
- Reducer + typed state interface + feature key constant
- `createFeatureSelector` + composed selectors
- Effects using `exhaustMap` / `switchMap` / `concatMap` appropriately
- Facade as the single component-facing API
- Colocated `.spec.ts` tests for reducer, selectors, and facade

## When to use

- Adding a new feature slice to an Angular + NgRx app.
- Bootstrapping state in a new Nx library.
- Replacing ad-hoc services-as-state with proper NgRx.
- Standardizing an existing feature that has drifted from the pattern.

## Before you start

Ask (or derive from context) the following — defaults in square brackets:

1. **Feature name** — kebab-case (e.g. `user-profile`). Used for folder and action source.
2. **Feature key** — usually the same word in camelCase (e.g. `userProfile`). Used as the reducer key.
3. **State shape** — what fields does this feature own? (entity? list? flags?)
4. **Data source** — HTTP, WebSocket, both? Which service will effects call?
5. **Framework version** — [`@ngrx/*` 16+ for `createActionGroup`]. If older, fall back to `createAction` + union types.

## Authoring workflow

1. Create the `+state/` folder inside the feature's lib/app.
2. Write files in this order — each one drives the next:
   1. `<feature>.models.ts` — state interface + domain types
   2. `<feature>.actions.ts` — `createActionGroup` with one event per use case
   3. `<feature>.reducer.ts` — feature key, initial state, `createReducer` with `on(...)` handlers
   4. `<feature>.selectors.ts` — feature selector + composed selectors
   5. `<feature>.effects.ts` — one effect per async event, calls services via `inject()`
   6. `<feature>.facade.ts` — exposes observables + dispatch methods
3. Register the reducer and effects in the lib/app module.
4. Write colocated `.spec.ts` for reducer, selectors, and facade (see references).
5. Verify: build passes, tests pass, DevTools shows dispatched actions.

## Non-negotiable rules

- **One facade is the only thing components inject.** Components never import the store, actions, or selectors directly.
- **Actions are events, not commands** — `'Load User Success'`, not `'Set User'`.
- **Reducers are pure** — no side effects, no service calls, no `Date.now()` hidden inside.
- **Effects use higher-order operators deliberately**:
  - `exhaustMap` for idempotent one-shot loads (avoid duplicate in-flight).
  - `switchMap` for user-driven queries (cancel previous).
  - `concatMap` for writes that must preserve order.
  - Never nested `subscribe()`.
- **Selectors are composed, not recomputed in components.**
- **Every async op has loading + error flags in state** (or a generic `RequestStatus` discriminant).
- **`providedIn: 'root'` for the facade** — singletons, no manual provider arrays.

## References

- [Feature layout and file roles](./references/layout.md) — folder shape, what each file owns.
- [File templates](./references/templates.md) — ready-to-adapt code for every file in the slice.
- [Effect operator cheatsheet](./references/effects.md) — when to use `exhaustMap` vs `switchMap` vs `concatMap`, with side-effect-only `{ dispatch: false }` patterns.
- [Test patterns](./references/tests.md) — Jest specs for reducer (action-by-action), selectors (`.projector()`), facade (`store.dispatch` spy).
- [Quality checklist](./references/checklist.md) — pre-merge review against the non-negotiables.
