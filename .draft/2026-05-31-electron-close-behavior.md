Objective: Add an Electron-only setting that controls what happens to the Polywise backend after the desktop window closes.

Behavior model:

1. keep_service: desktop window closes, backend keeps running, CLI access remains enabled.
2. disable_cli_access: desktop window closes, backend keeps running, local CLI auth bypass becomes disabled.
3. stop_service: desktop window closes, backend stops. This preserves the current default behavior.

Implementation plan:

1. Extend AppConfig in packages/polywise/src/types/config.ts with an electron close behavior union and config shape.
2. Add default config normalization in packages/polywise/src/config/loadConfig.ts for the new electron config.
3. Add a runtime state file under ~/.polywise that carries whether desktop-managed local CLI access is currently enabled.
4. Update packages/polywise/src/utils/localCliAuth.ts to require both the existing loopback header checks and the runtime CLI access flag.
5. Update packages/desktop/src/utils/polywise.ts so startup marks CLI access enabled and before-quit applies the configured close behavior:
      - keep_service => leave runtime alive and keep CLI enabled
      - disable_cli_access => leave runtime alive and disable CLI enabled flag
      - stop_service => disable CLI enabled flag and stop the runtime
6. Add a desktop RPC query for the renderer to read the current effective close behavior if needed.
7. Add an Electron-only field in packages/app/setting/general_setting/index.tsx that edits config.electron.close_behavior using the existing settings store.
8. Keep the setting hidden for non-Electron runtime.
9. Run Prettier on touched files, then run a type-check validation command if available.

Assumptions:

- Desktop startup should always re-enable CLI access while the app is open.
- The default close behavior remains stop_service to preserve current behavior.
- Local CLI access gating should only affect the auth-bypass path used by the bundled polywise CLI, not generic localhost requests.
