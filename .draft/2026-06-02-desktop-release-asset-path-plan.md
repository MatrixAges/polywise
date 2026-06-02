1. Inspect the desktop release workflow source, generated workflow, and desktop electron-builder configuration to identify where macOS zip artifacts are emitted and where collection expects them.
2. Update the workflow asset glob definitions so macOS zip artifacts are collected from the actual build output directory while preserving the upload destination layout.
3. Verify the changed glob definitions against the collection script expectations and summarize the concrete root cause and fix.
