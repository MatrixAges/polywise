# Website Steps Plan

Last Updated: 2026-05-31

## Goal

Add an MDX `Steps` component to `packages/website` and use it in the intro docs immediately after installation.

## Changes

1. Add `packages/website/unify.md` so `website` has a package routing table before code edits.
2. Add `Steps` and `Step` MDX components under `packages/website/components/Mdx/Steps/`.
3. Register the new MDX components in `packages/website/components/Mdx/index.ts`.
4. Insert a quick-start `Steps` section after `Install` in `packages/website/public/content/docs/intro/{zh,en,ja}.mdx`.
5. Reword the `Configure` section intro so the new quick-start sequence is the primary onboarding order.

## Validation

1. Run Prettier on touched files.
2. Run `vinext check` in `packages/website`.
