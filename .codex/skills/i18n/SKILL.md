---
name: i18n
description: Maintain project internationalization with i18next and typed locale modules. Use when adding, renaming, or restructuring translation keys, editing locale files, wiring multilingual UI, or removing hardcoded user-facing strings from the codebase.
---

# i18n

Keep locale changes complete across languages.

When adding or changing copy:

- Update every supported locale, not just one.
- Keep key structure identical across locale files.
- Avoid hardcoded visible strings in components when they belong in translations.

Use these project conventions:

- Use `snake_case` keys.
- Keep nesting shallow and organized by module or feature.
- Export locale objects with `export default`.
- Use `as const` on assembled locale entry points so key inference remains strong.

Before finishing:

- Check that the new keys are reachable from the locale index.
- Check that renamed or removed keys are updated in all locales and call sites.
- Preserve interpolation placeholders consistently across languages.
