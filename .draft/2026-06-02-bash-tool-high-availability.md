## Goal

Raise `bash_tool` reliability in project sessions by removing path-semantic drift between sandbox execution and host execution, preserving useful command output, and improving guidance for model-generated commands.

## Root Cause

`bash_tool` currently has two execution paths:

1. Safe commands run in `just-bash`, where `/` is the virtual root mapped to `s.cwd`.
2. Commands matching audit rules run in the host shell after approval, where `/` is the host filesystem root.

Commands with pipes such as `find /packages/polywise/src -type f | head -5` therefore become unstable:

- In sandbox mode, `/packages/polywise/src` is valid.
- In host mode, `/packages/polywise/src` is invalid unless the host cwd happens to expose that path.

The host path also returns misleading `exitCode: 0` for failing pipelines because no `pipefail` behavior is enforced, and the result adapter clears `stdout` whenever `stderr` is non-empty.

## Repair Plan

1. Keep `bash_tool` execution inside `just-bash` even after audit approval.
2. Stop routing audited sandbox commands to `executeRiskyCommand`.
3. Preserve both `stdout` and `stderr` in the bash response adapter.
4. Improve sandbox tool instructions to explain the virtual root path model clearly.
5. Keep native host execution behavior limited to native/system access tools.

## Verification

1. Reproduce representative commands with and without pipes.
2. Confirm audited commands no longer lose virtual path semantics.
3. Run package type-check only.
