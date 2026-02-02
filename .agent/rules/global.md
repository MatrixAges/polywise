---
trigger: always_on
---

## Saving Context (CRITICAL)

BEFORE executing ANY other tool or responding to the user, you MUST save the raw user input (the current prompt) verbatim to the `.prompts/[YYYY-MM-DD]/[HH-mm-ss].md` file. If the input is not in English, it MUST be translated into English before saving.

- **Time Retrieval:** You MUST use the `bash` tool with `date "+%H-%M-%S"` to get the current timestamp for the filename. Do not rely on internal time.
- **Strict Order:** This is the absolute first action for every new turn.
- **Dependency:** You are prohibited from using `read`, `edit`, or any other tool for the user's task until this context file is successfully written. `bash` is only allowed initially for `date` retrieval.
- **Path Example:** `.prompts/2026-01-22/11-43-50.md`.
- **Read Restriction:** Unless explicitly instructed, reading files in the `.prompts` folder is prohibited; only writing is allowed.

## Tool Calls

- When using the `edit` tool, ensure that `filePath` is the complete path relative to the project root directory.
- Do not generate incomplete `newString`; the complete file content after replacement must be provided.
- If unsure of the file path, use the `ls` or `find` tool to confirm; guessing is strictly prohibited.

- When calling the `bash` tool, strictly adhere to the parameter schema.
- The `description` field **must** be included, briefly explaining the command's purpose.
- Example format: `bash(command="ls", description="List files in the current directory")`

## Read Agentmap (CRITICAL)

After saving context, BEFORE reading any other files or executing tasks, you MUST read `agentmap.md` from the root directory.

- **Strict Order**: This is the SECOND action (after saving context) for every task involving file operations.
- **Dependency**: You are prohibited from using `read`, `edit`, or any other tool for file operations until `agentmap.md` has been successfully read.
- **Purpose**: Understand the latest project architecture and code standards.
- **Path**: `/agentmap.md` (relative to project root).

## Update Agentmap (CRITICAL)

After completing ANY task that changes project files (adds, renames, deletes files or directories), you MUST update `agentmap.md` with the updated file tree and descriptions.

- **When**: After all file changes are complete.
- **What**: Update the JSON tree in section 3 of agentmap.md.
- **Dependency**: Do not consider the task complete until agentmap.md is updated.

Answer questions accurately and concisely, providing the optimal solution and offering multiple solutions or possibilities.

Note: The code must be concise, without any irrelevant template code. Only reply with the core code relevant to the question, and the code must be enclosed in Markdown code blocks.

## Output Code Style:

- All variable names use Rust-style snake_case.
- All functions use camelCase (if it's a sub-component alias within a component, use PascalCase).
- All names should be professional and concise, not too long.
- Code line break logic: Use blank lines to separate code context for better readability; use a blank line if the execution style of the previous and next statements differs.

## Code Spacing

Use blank lines to separate code with different execution styles or visual appearances. The fundamental principle: **if two consecutive statements look different in terms of execution style, add a blank line between them.**

### Visual Separation Principle

The blank line creates **visual grouping** that mirrors the logical grouping of code operations. Think of it as creating "paragraphs" in your code:

- **Setup paragraph**: Variable declarations and initial configuration
- **Execution paragraph**: The actual work being done (async operations, calculations)
- **Result paragraph**: Return statements, conditional logic, or state verification

- The output code should not contain any comments!!! (Important!!!) Good code naming doesn't require comments.
- All pages and components use PascalCase naming.

## The Minimalist Approach

- **Code as Documentation:** Redundant comments are strictly prohibited. Express intent through intuitive variable naming (`snake_case`), function naming (`camelCase`), and clear logic flow (`if-return` early returns). If code requires comments to be understood, it needs refactoring.
- **Single Level of Abstraction:** A function or component should only do one thing and remain at the same level of abstraction. Avoid mixing low-level DOM manipulation with complex rendering logic.
- **Stateless First:** Prioritize writing pure functions and stateless components. Only consider introducing reactive state or models when persistence or multi-component sharing is truly necessary.
- **On-demand Loading:** Do not introduce unused dependencies. Utility functions (`utils`) should remain lightweight and dependency-free, avoiding heavy full-package imports.
- **Config-driven:** For variable requirements, drive functionality through configuration files (such as `locales` or `presets`) rather than hardcoding logic branches.
- **Atomic Logic:** Logic blocks should be as small as possible. For side effects in React (`useEffect`), split them into multiple single-responsibility hooks instead of one large side-effect function.

## Structured Design

- **Fractal Architecture:** Organize resources using the "proximity principle." Large functional modules (such as `pages` or `layout` in `packages/app`) should contain their private `components/`, `models/`, `types/`, and `styles/` folders. Only truly globally shared resources should be placed in the corresponding folders at the root level.
- **Process Isolation and Communication:** Strictly distinguish between the rendering process (`app`), the main process (`desktop`), and the shared utility library (`stk`). Inter-process communication must be conducted through type-safe channels defined by `erpc`, and direct cross-process dependencies on business logic are strictly prohibited. - **Single Responsibility Principle**:
- `models/`: Only responsible for reactive state management and pure business logic, without involving DOM or UI interaction.
- `components/`: Only responsible for view rendering and user interaction logic; complex logic should be delegated to `models`.
- `utils/`: Only contains pure utility functions without side effects.
- **Dependency Injection (DI)**: Use `tsyringe` to manage object lifecycles. Manage global state using `singleton` and instantiable functional modules using `injectable`, avoiding the coupling caused by manual instantiation.
- **Atomic Components**:
- Avoid writing large list items in the main file.
- Content within `map` loops must be extracted into independent child components.
- If a component's internal logic exceeds 4 reactive variables, it must be split into a local Model.

## File Handling Specifications

- If the code exceeds 80 lines, modular splitting is required. When splitting modules, do not put everything in the same level directory; place them in the `components` folder of their respective location. Component names within the `components` folder should be as concise as possible (because they are scoped, so there's no need to prefix them with something like `TaskDetail**`, just declare their name directly).
- Actively create `components` folders for large modules to maintain code style; one component per file.
- For components rendered in a loop, the content being rendered should be made into a separate component, allowing the component itself to be looped, which is clearer.

Generated code must conform to the existing project's style. Mimic how the existing project organizes its code to maintain consistency.

## Coding Standards

Relevant skills are located in the `.opencode/skills` directory.

- TypeScript: typescript/SKILL.md
- React coding best practices: See react/SKILL.md
- MobX state management best practices: See mobx/SKILL.md
- Tailwind CSS + CSS Modules styling best practices: See css/SKILL.md
- i18n best practices: See i18n/SKILL.md
- Electron main process and renderer process data interaction best practices: See erpc/SKILL.md

## Type Inference Over Explicit Types

Unless necessary for complex scenarios or public API clarity, do not explicitly specify function return types. Let the TypeScript compiler infer types automatically.

**Good:**

```typescript
async function fetchData() {
  return await api.get('/data')
}

async processItem(item: Item) {
  await this.save(item)
}
```

**Avoid (unless necessary):**

```typescript
async function fetchData(): Promise<Data[]> {
  return await api.get('/data')
}

async processItem(item: Item): Promise<void> {
  await this.save(item)
}
```

## Class Function Ordering

When organizing class functions, follow this strict order:

1. **constructor** - Instance initialization
2. **init** - Initialization/setup methods (e.g., `init`, `setup`, `configure`)
3. **Public methods** - All public API methods
4. **Private methods** - Internal utility methods (prefixed with `_` or `private`)
5. **Helper methods** - Private helper/auxiliary methods
6. **off/destroy** - Cleanup methods at the end (e.g., `off`, `destroy`, `dispose`, `cleanup`)

Example:

```typescript
export class MyClass {
	constructor() {}

	async init() {}

	async publicMethod1() {}
	async publicMethod2() {}

	private async _privateMethod1() {}
	private async _privateMethod2() {}

	private async _helper() {}

	off() {}
}
```

## Database Schema Migration (CRITICAL)

When modifying database schema in the polywise package, you MUST update the migration system:

### Migration Rules:

1. **Version Increment**: Increment `CURRENT_SCHEMA_VERSION` in `migration.ts`
2. **Add Migration**: Add a new migration object to the `migrations` array
3. **Migration Content**: Use `up` function for schema changes (CREATE, ALTER, DROP) and data migration
4. **Sequential Versions**: Migration versions must be sequential (1, 2, 3...)

### Example Migration:

```typescript
// In migration.ts
export const CURRENT_SCHEMA_VERSION = 2

export const migrations: Migration[] = [
	// ... existing migrations

	{
		version: 2,
		description: 'Add metadata column to nodes',
		up: async (exec, query) => {
			// Schema change
			await exec(`ALTER TABLE brain.nodes ADD COLUMN IF NOT EXISTS metadata JSONB;`)

			// Data migration
			const nodes = await query<{ id: number }>('SELECT id FROM brain.nodes')
			for (const node of nodes) {
				await query(`UPDATE brain.nodes SET metadata = $1 WHERE id = $2`, [JSON.stringify({}), node.id])
			}
		}
	}
]
```

### Automatic Migration on Init:

The `Polywise.init()` method automatically:

1. Checks current schema version from `meta.schema_version` table
2. Applies all pending migrations
3. Records applied versions

**CRITICAL**: Always update `CURRENT_SCHEMA_VERSION` when modifying table structure!

## Test-Driven Development (TDD) for packages/polywise

When working on `packages/polywise`, you MUST follow TDD principles:

### TDD Cycle (Red-Green-Refactor):

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up while keeping tests green

### TDD Rules:

1. **Test First**: Never write implementation code without a failing test
2. **Atomic Tests**: Each test should verify ONE specific behavior
3. **Descriptive Names**: Test names should describe behavior, not implementation
4. **Independent Tests**: Tests should not depend on each other
5. **Run Tests**: Always run tests after each change

### Test File Structure:

- Main test file: `test/test.spec.ts` - Core functionality tests
- Migration tests: `test/migration.spec.ts` - Database migration tests
- New features: Create dedicated `test/[feature].spec.ts` files

### Example TDD Workflow:

```typescript
// Step 1: Write failing test
it('should calculate node magnitude from coordinates', async () => {
	const node_id = await poly.addNode('Test', 3, 4, 0.5)
	const magnitude = await poly.getNodeMagnitude(node_id)
	expect(magnitude).toBe(5) // 3-4-5 triangle
})

// Step 2: Run test (should fail)
// pnpm run test

// Step 3: Implement minimal code
async getNodeMagnitude(node_id: number) {
	const node = await this.query('SELECT x, y FROM brain.nodes WHERE id = $1', [node_id])
	return Math.sqrt(node[0].x ** 2 + node[0].y ** 2)
}

// Step 4: Run test (should pass)
// Step 5: Refactor if needed
```

### TDD Checklist:

- [ ] Did you write the test BEFORE the implementation?
- [ ] Does the test name describe WHAT not HOW?
- [ ] Is the test independent (no shared state with other tests)?
- [ ] Did you run the test and see it fail first (Red)?
- [ ] Did you write minimal code to make it pass (Green)?
- [ ] Did you refactor while keeping tests passing?
- [ ] Are all tests passing before committing?

## Utils Export Convention (CRITICAL)

All utility functions in `utils/` folders MUST follow this pattern:

### Export Rule:

- Use `export default` with arrow function syntax: `export default () => {}`
- Do NOT write function return type annotations (let TypeScript infer)
- Use anonymous arrow functions (no function name after `default`)

**Good:**

```typescript
// utils/calculateWeight.ts
export default (learning_rate: number) => 0.5 * learning_rate

// utils/generateNodePosition.ts
export default () => ({
	x: Math.random() * 800,
	y: Math.random() * 600
})

// utils/index.ts
export { default as calculateWeight } from './calculateWeight'
```

**Avoid:**

```typescript
// Don't use named exports
export function calculateWeight(learning_rate: number): number {
	return 0.5 * learning_rate
}

// Don't use function declaration syntax
export default function calculateWeight(learning_rate: number) {
	return 0.5 * learning_rate
}

// Don't specify return types
export default (learning_rate: number): number => 0.5 * learning_rate
```

## Types File Organization (CRITICAL)

When organizing `types/` folders:

### Splitting Rule:

- If a types file exceeds **50 lines**, split it into separate files by category

### Merging Rule:

- If multiple types files are each under **20 lines**, merge them into a single file

### Example Structure:

```
types/
├── index.ts          # Re-exports all types
├── node.ts           # Node-related types (if > 50 lines)
├── edge.ts           # Edge-related types (if > 50 lines)
└── common.ts         # Shared types (merged if all < 20 lines)
```

## No Return Type Annotations (CRITICAL)

**NEVER** explicitly specify function return types unless absolutely necessary for complex scenarios or public API clarity. Let TypeScript infer types automatically.

This applies to:

- All utility functions in `utils/`
- All private methods
- All internal functions

Only consider explicit return types for:

- Public library APIs
- Complex recursive types
- Overload signatures

## Class Export Convention

Each class MUST be in its own file with a default export:

**Good:**

```typescript
// Article.ts
export default class Article {
	constructor(params: ArticleParams) {}
}

// Polywise.ts
export default class Polywise {
	public article: Article
	constructor() {
		this.article = new Article({ exec, query })
	}
}
```

**Avoid:**

```typescript
// Don't use named exports for classes
export class Article {}

// Don't put multiple classes in one file
export class Article {}
export class AnotherClass {}
```

## Function & Class Model Parameters Convention

When a function or class constructor has more than 2 parameters, use an object parameter for better flexibility. The parameters must follow these style rules:

- **Parameter Name**: Always use `args` for the object parameter.
- **Type Name**: Always use `*Args` for the interface/type name (e.g., `CreateNodeArgs`).
- **Destructuring**: Always destructure the `args` object at the beginning of the function or constructor.
- **Ordering Rule**: `Required Variables` > `Optional Variables` > `Required Functions` > `Optional Functions`

**Good:**

```typescript
interface CreateNodeArgs {
	// Required Variables
	label: string
	x: number
	y: number

	// Optional Variables
	threshold?: number
	idol_id?: string

	// Required Functions
	onCreated: (id: number) => void

	// Optional Functions
	onFired?: () => void
}

async createNode(args: CreateNodeArgs) {
	const { label, x, y, threshold, idol_id, onCreated, onFired } = args

	await this.query(sql.createNode, [label, x, y])
}
```

**Avoid:**

```typescript
// Using 'params' instead of 'args'
async createNode(params: CreateNodeArgs) {}

// Missing destructuring
async createNode(args: CreateNodeArgs) {
	await this.query(sql.createNode, [args.label, args.x, args.y])
}

// Mixed order or positional parameters
async createNode(
	label: string,
	x: number,
	y: number,
	threshold = 0.5,
	idol_id?: string
) {}
```

## Final Guarantee

- **Important:** Do not write any comments to explain the code!!! - Do not make modifications to modules that are not mentioned. If you realize that you need to modify pages or modules that are not mentioned, you must confirm with the user before performing the relevant operations.
- Never execute any non-read-only Git commands from the command line at any time.
