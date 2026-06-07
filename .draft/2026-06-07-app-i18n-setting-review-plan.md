## Objective

Complete multilingual support for the remaining `packages/app` surfaces with the following constraints:

- Finish all requested page scopes: layout, shared components, home, session, agent, linkcase, post, article, and setting.
- Do not localize the todo page.
- Keep page-level locale payloads lazy loaded and removable on page switch.
- Keep global/shared locale payloads eagerly loaded.
- Do not use `$t` directly inside React components.
- Reserve `$t` for MobX models and other non-React code paths only.
- Review the uncommitted implementation after the migration.
- Review Chinese translations under `packages/app/locales/zh-cn` and correct awkward or misleading wording.

## Requirement Summary

1. `packages/app/models/locale.ts` and `packages/app/utils/i18n.ts` must support eager global namespaces and lazy page namespaces.
2. React components must obtain translations from hooks such as `useTranslation(...)` or a page helper hook.
3. MobX models may continue to use `$t(...)` because they do not run in a React render context.
4. `setting` was omitted earlier and must now be fully included in the migration scope.
5. The final code review must focus on unfinished requirements, fragile design, regressions, missed reuse, and validation gaps.

## Execution Plan

### Phase 1: i18n runtime shape

- Keep `translation`, `layout`, and `components` eager.
- Keep page namespaces lazy: `home`, `session`, `agent`, `linkcase`, `post`, `article`, `setting`.
- Use `usePageLocale(...)` only to load and unload page namespaces, not as a replacement for component-level translation hooks.

### Phase 2: component boundary correction

- Replace all direct `$t(...)` usage in React components with hook-provided `t(...)`.
- Keep `$t(...)` only in MobX models such as page models and non-React helpers.
- Normalize helper functions that build translated tab items so they receive a `t` function instead of reading `$t` directly.

### Phase 3: setting surface completion

- Add a dedicated `setting` namespace for:
     - setting navigation labels
     - general setting page copy
     - MCP page copy
     - service provider page copy
     - IM page copy
     - model setting page copy
     - about/feedback page copy
- Reuse the existing `translation` namespace where provider-related strings are already established, instead of duplicating keys.

### Phase 4: content review

- Inspect the current uncommitted diff with `git status --short` and targeted reads.
- Identify requirement gaps, design issues, risky assumptions, and missing validation.
- Fix review findings when they are clearly actionable inside the current scope.

### Phase 5: translation review

- Review `packages/app/locales/zh-cn/**/*.ts`.
- Correct wording that is unnatural, overly literal, inconsistent, or semantically misleading.
- Preserve interpolation placeholders and key shape parity with English files.

## Verification Approach

- Run TypeScript checking through the local `packages/app/node_modules/.bin/tsc` entry with `--ignoreDeprecations 6.0`.
- Treat unrelated workspace-level errors outside the current app i18n changes as residual blockers, not as reasons to stop app-level completion.

## Review Focus

- Lazy namespace loading correctness and cleanup behavior
- Component/model translation boundary correctness
- Missing setting-page localization coverage
- Translation consistency between English and Chinese locale trees
- Any lingering hardcoded visible strings in the requested scope
