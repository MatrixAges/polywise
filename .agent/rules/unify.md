## Unify Rules: Entropy Control and Style Unification

### 1. Core Goal

Code entropy must be tightly controlled during project evolution.
Any new implementation or refactor must follow a clone-first pattern:
reuse mature structures from the same module type (imports, naming, state layout, layering, and function flow) before introducing any new style.

### 2. Responsibility of `unify.md`

`unify.md` is the package-level style routing table and must be maintained in Tree JSON format.

Each routing node must contain at least:

1. `path_scope`: absolute routing prefix for folder-level matching (required).
2. `description`: responsibility boundary of the scoped folder (required).
3. `fractal_rule`: folder depth and split strategy (required).
4. `import_order`: import ordering contract (required).
5. `naming_rules`: naming contract (required).
6. `Same Code 1`: primary template (required).
7. `Same Code 2`: secondary template (required).
8. `sample_pool`: additional examples (required, 2+ files).

### 3. Required Routing Granularity (Hard Requirement)

`unify.md` must be maintained at folder-level granularity, not broad module-level categories.

Mandatory:

1. Define nodes at second-level and third-level business directories.
2. Add dedicated nodes for specialized subfolders (for example: `.../rpc/session`, `.../fst/tools/skill`).
3. Do not use one broad node to cover multiple unrelated folders.
4. Keep a parent fallback node only if child nodes already exist.
5. Matching must use longest-prefix-wins on `path_scope`.

### 4. Mandatory SOP (No Skips)

Before any code generation or modification, the following sequence is mandatory:

1. Route targeting: read the target package `unify.md`, collect all candidate nodes by `path_scope`.
2. Route resolution: pick the node with longest matching `path_scope`.
3. Rule extraction: extract structure/import/naming/layering rules from that node.
4. Primary sample learning: read `Same Code 1` and derive implementation skeleton.
5. Pixel-level imitation: inject business changes into the `Same Code 1` skeleton.
6. Rule review: verify generated code against node rules.
7. Anti-overfitting check: read `Same Code 2`, triangulate with both samples.

### 5. Hard Gate (Blocking Conditions)

Stop all write operations immediately if any of the following is true:

1. Target package has no `unify.md`.
2. Matched node is missing `path_scope`.
3. No node matches the target path by `path_scope`.
4. Multiple nodes match but no deterministic longest-prefix winner exists.
5. Matched node misses `Same Code 1` or `Same Code 2`.
6. Any `Same Code` path is unreachable.
7. `sample_pool` has fewer than 2 reachable files.
8. Generated code cannot explain structural correspondence to both samples.

### 6. Rules for Updating `unify.md` (Routing Maintenance Protocol)

When updating any package `unify.md`, follow this protocol in order:

1. Discover real folders from current package tree.
2. Ensure every active second-level/third-level business folder has a node.
3. Add or fix `path_scope` for every node.
4. Rebind `Same Code 1/2` to reachable files within the same folder scope or immediate neighboring scope.
5. Ensure `sample_pool` has 2+ reachable files.
6. Remove stale nodes or stale sample paths.
7. Keep parent fallback nodes after child nodes are complete.
8. Re-run path reachability checks for all `Same Code` and `sample_pool` files.

No partial update is allowed.

### 7. Mandatory Evidence Output

Before editing code, output `UNIFY_EXECUTION_CONTEXT` with at least:

1. Target package and selected node.
2. Target file path and winning `path_scope`.
3. Top 3 candidate nodes by prefix length (with winner marked).
4. Real paths of `Same Code 1/2`.
5. Three structural rules extracted from samples.

After implementation, output `UNIFY_COMPLIANCE_REPORT` with at least:

1. Reuse points (import order, naming, structural layering).
2. Differences from samples.
3. Business reason for each difference.

When `unify.md` itself is updated, also output `UNIFY_ROUTING_CHANGE_REPORT`:

1. Added nodes (with `path_scope`).
2. Removed nodes.
3. Fixed sample paths.
4. Coverage summary for second-level/third-level folders.
5. Uncovered folders (if any) and reason.

### 8. Quality Bar for `unify.md` Updates

A `unify.md` update is valid only when all are true:

1. Folder-level routing is complete for second-level/third-level business directories.
2. All nodes have required fields.
3. All `Same Code 1/2` and `sample_pool` files are reachable.
4. Longest-prefix matching is deterministic.
5. Reports are provided (`UNIFY_EXECUTION_CONTEXT`, `UNIFY_ROUTING_CHANGE_REPORT`).

### 9. Routing Maintenance Duty

If code evolution makes sample paths invalid, folder scopes outdated, or nodes incomplete:
update the corresponding package `unify.md` first.
Routing must stay executable, verifiable, and reusable over time.
