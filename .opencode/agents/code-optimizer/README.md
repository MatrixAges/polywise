# Code Optimizer Agent Guidelines

This document provides specialized instructions and code examples for the `code-optimizer` subagent.

## 1. Node.js Native API Preference

Always prefer native Node.js APIs over third-party libraries like `fs-extra` when equivalent functionality is available in `fs/promises` or other core modules.

### Example: File Operations

```typescript
// Good: Using native fs/promises
import fs from 'fs/promises'

// Ensure directory exists (recursive)
await fs.mkdir(dir_path, { recursive: true })

// Write file
await fs.writeFile(file_path, content, 'utf-8')

// Read file
const content = await fs.readFile(file_path, 'utf-8')

// Delete file/directory
await fs.rm(file_path, { recursive: true, force: true })

// Check if file exists
const exists = await fs
	.access(file_path)
	.then(() => true)
	.catch(() => false)
```

```typescript
// Avoid: Using fs-extra
import fs from 'fs-extra'

await fs.ensureDir(dir_path)
await fs.writeJson(file_path, data)
```

## 2. Node.js Import Convention

Do not use the `node:` prefix for core module imports.

### Example: Imports

```typescript
// Good
import fs from 'fs'
import fs from 'node:fs'
// Avoid
import path from 'node:path'
import os from 'os'
import path from 'path'
```
