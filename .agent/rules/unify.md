## Unify Rules: Entropy Control and Style Unification

### Core Rule

`unify.md` is the package-level style routing table in Tree JSON format.

Each routing node must contain only:

1. `path_scope`: absolute routing prefix for folder-level matching (required).
2. `sample_pool`: reference files for the scoped folder (required, 2+ reachable files).

### Routing Granularity

`unify.md` must be maintained at folder-level granularity.

1. Define nodes at second-level and third-level business directories.
2. Add dedicated nodes for specialized subfolders.
3. Do not use one broad node to cover multiple unrelated folders.
4. Keep a parent fallback node only if child nodes already exist.
5. Matching must use longest-prefix-wins on `path_scope`.

### Hard Gate

Stop all write operations immediately if:

1. Target package has no `unify.md`.
2. Matched node is missing `path_scope`.
3. No node matches the target path by `path_scope`.
4. Multiple nodes match but no deterministic longest-prefix winner exists.
5. `sample_pool` has fewer than 2 reachable files.
