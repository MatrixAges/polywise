## Unify Rules: Entropy Control and Style Unification

### Core Rule

`unify.md` is the package-level style routing table in Tree JSON format.

Each routing node must contain only:

1. `path_scope`: absolute routing prefix for folder-level matching (required).
2. `sample_pool`: reference files for the scoped folder (required, 2+ reachable files).

### Routing Granularity

`unify.md` must be maintained at outline-level folder granularity.

1. Prefer package root and first-level business-domain folders.
2. In most packages, stop at one or two levels deep.
3. Add a third-level node only for very large, stable coordination roots such as runtime kernels, router hubs, or data layers.
4. Do not create nodes for routine leaf components, one-off page folders, or incidental helper subfolders.
5. Keep a parent fallback node when deeper child nodes exist.
6. Matching must use longest-prefix-wins on `path_scope`.

### Hard Gate

Stop all write operations immediately if:

1. Target package has no `unify.md`.
2. Matched node is missing `path_scope`.
3. No node matches the target path by `path_scope`.
4. Multiple nodes match but no deterministic longest-prefix winner exists.
5. `sample_pool` has fewer than 2 reachable files.
