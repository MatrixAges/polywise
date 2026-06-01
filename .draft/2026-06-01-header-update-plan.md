## Request

Reference `/Users/xiewendao/Documents/OpenAges/if` update flow and integrate update UI into `packages/app` and `packages/desktop`.

## Scope

- `packages/desktop/src/rpc/app/onUpdate.ts`
- `packages/app/models/global.ts`
- `packages/app/types/app.ts`
- `packages/app/layout/types.ts`
- `packages/app/layout/components/Header/*`
- `packages/app/locales/en/global.ts`
- `packages/app/locales/zh-cn/global.ts`

## Plan

1. Fix desktop updater event mapping so `update-not-available` emits `cant_update` instead of `downloaded`.
2. Reuse the existing desktop RPC routes from renderer by subscribing in `GlobalModel`, storing update state, and exposing `checkUpdate`, `downloadUpdate`, and `installUpdate`.
3. Add Header left-side update entry:
      - show arrow-up icon button when `has_update`
      - switch to circular progress during `downloading`
      - auto-trigger install when download completes
      - surface tooltip and error/no-update feedback through locale strings and toast
4. Restrict update UI and update flow to Electron runtime only so non-desktop surfaces neither subscribe nor render the button.
5. Run Prettier on touched files, then run package type-check validation only.
