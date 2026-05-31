---
name: mobx
description: Apply project MobX and tsyringe patterns for state models, dependency injection, and lifecycle management. Use when creating or refactoring stores, local models, singleton state, or cross-model coordination in this codebase.
---

# MobX

Model state by responsibility, not by screen size alone.

Use these defaults:

- `@singleton()` for shared global state.
- `@injectable()` for local or feature-scoped models.
- `makeAutoObservable(..., { autoBind: true })` for instance methods that will be passed around.

Keep models clean:

- Exclude injected dependencies from observability when they are service references or child models.
- Split models when state or logic grows too wide.
- Prefer composition of smaller models over one giant observable class.

Lifecycle rules:

- Give long-lived models explicit setup and teardown paths such as `init()` and `off()` when they own subscriptions or side effects.
- Collect disposers and release them reliably.

When wiring parent and child models:

- Do not recursively resolve the parent from the child if that creates a new instance.
- Pass references deliberately when instance identity matters.
