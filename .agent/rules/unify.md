## Unify Rules: Entropy Control and Style Unification

### 1. Core Goal

Code entropy must be tightly controlled during project evolution. Any new implementation or refactor must follow a clone-first pattern: reuse mature structures from the same module type (imports, naming, state layout, layering, and function flow) before introducing any new style.

### 2. Responsibility of `unify.md`

`unify.md` is the package-level style routing table and must be maintained in Tree JSON format.

Each routing node must contain at least:

1. `description`: responsibility boundary of the module type.
2. `fractal_rule`: folder depth and split strategy.
3. `import_order`: import ordering contract.
4. `naming_rules`: naming contract.
5. `Same Code 1`: primary template (required).
6. `Same Code 2`: secondary template (required).
7. `sample_pool`: optional additional examples (2+ recommended).

### 3. Mandatory SOP (No Skips)

Before any code generation or modification, the following sequence is mandatory:

1. Route targeting: read the target package `unify.md` and match a node.
2. Rule extraction: extract structure/import/naming/layering rules from that node.
3. Primary sample learning: read `Same Code 1` and derive the implementation skeleton.
4. Pixel-level imitation: inject business changes into the `Same Code 1` skeleton.
5. Rule review: verify the generated code against node rules.
6. Anti-overfitting check: read `Same Code 2` and triangulate against both samples to ensure pattern reuse instead of business constant copy.

### 4. Hard Gate (Blocking Conditions)

Stop all write operations immediately if any of the following is true:

1. Target package has no `unify.md`.
2. Matched node misses `Same Code 1` or `Same Code 2`.
3. Any `Same Code` path is unreachable.
4. Generated code cannot explain structural correspondence to both samples.

### 5. Mandatory Evidence Output

Before editing code, output `UNIFY_EXECUTION_CONTEXT` with at least:

1. Target package and matched node.
2. Real paths of `Same Code 1/2`.
3. Three structural rules extracted from samples.

After implementation, output `UNIFY_COMPLIANCE_REPORT` with at least:

1. Reuse points (import order, naming, structural layering).
2. Differences from samples.
3. Business reason for each difference.

### 6. Routing Maintenance Duty

If code evolution makes sample paths invalid or routing nodes incomplete, update the corresponding package `unify.md` first. Routing must stay executable, verifiable, and reusable over time.
