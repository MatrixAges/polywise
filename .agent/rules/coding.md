## Coding Standards

Relevant skills are located in the `.opencode/skills` directory.

- TypeScript: typescript/SKILL.md
- React coding best practices: See react/SKILL.md
- MobX state management best practices: See mobx/SKILL.md
- Tailwind CSS + CSS Modules styling best practices: See css/SKILL.md
- i18n best practices: See i18n/SKILL.md
- Electron main process and renderer process data interaction best practices: See erpc/SKILL.md

## Type Inference Over Explicit Types

Unless necessary for complex scenarios or public API clarity, do not explicitly specify function return types. Let the TypeScript compiler infer types automatically. Do not pass generic types to functions if the type system can infer them from the arguments.

## No Any Type (CRITICAL)

**NEVER** use the `any` type in TypeScript code. Always use specific types, interfaces, or `unknown` if the type is truly not known yet. Using `any` defeats the purpose of TypeScript and is strictly prohibited.

## SQL Definition Convention (CRITICAL)

All SQL statements MUST be defined within the `sql/` directory and exported for use. Raw SQL strings are prohibited within business logic files (models, services, etc.).

**Rules:**

1. **Location**: Place SQL files in `src/sql/`.
2. **Export**: Export SQL strings or functions that return SQL strings.
3. **Import**: Import SQL using named imports `import { sql_query, sql_insert } from './sql'`.

### SQL Comments (CRITICAL)

All exported SQL strings or functions in `src/sql/` MUST be preceded by a JSDoc-style comment (`/** ... */`). This comment must describe:

1.    **Operation**: What specific database action is being performed.
2.    **Role**: The purpose of this operation within the larger system architecture.

## Node.js Native API and Import Convention (CRITICAL)

- **Library Preference**: ALWAYS prefer `fs-extra` over native Node.js `fs/promises` for consistent enhanced file system operations.
- **Import Style**: NEVER use the `node:` prefix for core Node.js module imports. Use the standard module name directly.
- **Reference**: Detailed code examples for these conventions are maintained in the `@code-optimizer` subagent documentation.

## Class Function Ordering

When organizing class functions, follow this strict order:

1. **constructor** - Instance initialization
2. **init** - Initialization/setup methods (e.g., `init`, `setup`, `configure`)
3. **Public methods** - All public API methods
4. **Private methods** - Internal utility methods (prefixed with `_` or `private`)
5. **Helper methods** - Private helper/auxiliary methods
6. **off/destroy** - Cleanup methods at the end (e.g., `off`, `destroy`, `dispose`, `cleanup`)

- If the constructor body is empty, remove the constructor entirely. Only define a constructor when it has actual initialization logic.
- Avoid using `any` type unless absolutely necessary. Use specific types, `unknown`, or generics instead.
- Do not keep empty functions. If a function body is empty (no implementation), remove it entirely.

## Database Schema Migration (CRITICAL)

When modifying database schema in the polywise package, you MUST update the migration system:

## Migration Rules:

1. **Direct SQL Modification Preferred**: During the pre-production phase, directly modify SQL definitions in the schema files unless explicitly asked to write a migration. Keep `CURRENT_SCHEMA_VERSION` at 1.
2. **Version Increment**: Only increment `CURRENT_SCHEMA_VERSION` in `migration.ts` when explicitly requested.
3. **Add Migration**: Only add a new migration object to the `migrations` array when explicitly requested.
4. **Migration Content**: Use `up` function for schema changes (CREATE, ALTER, DROP) and data migration
5. **Sequential Versions**: Migration versions must be sequential (1, 2, 3...)

**CRITICAL**: Only update `CURRENT_SCHEMA_VERSION` when explicitly requested to write a migration!

## Unique String IDs (CRITICAL)

**ALL IDs in the system MUST be unique strings (e.g., uuid v7), NOT auto-incrementing integers.**

This applies to:

- Database primary keys (`id` fields)
- Foreign key references (`source_id`, `target_id`, `article_id`, `node_id`, etc.)
- All entity identifiers exposed through APIs

**Rationale:**

- Better suited for distributed systems
- No information leakage about system state
- Easier data merging and synchronization
- Time-sortable with better database index performance (uuid v7)

**Implementation:**

- Use `TEXT PRIMARY KEY` instead of `SERIAL PRIMARY KEY` in PostgreSQL
- Use `TEXT REFERENCES` instead of `INTEGER REFERENCES` for foreign keys
- Generate IDs using `uuidv7()` before insertion
- All ID parameters in functions should be `string` type

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
5. **Run Tests**: Always run tests after each change. When testing specific functionality, use `TEST_FILE=test/abc.spec.ts pnpm test` to accelerate the process and avoid full test suite execution.
6. **Full Suite**: Run the full test suite (`pnpm test`) before final submission or major commits to ensure no regressions.

### Test File Structure:

- Main test file: `test/test.spec.ts` - Core functionality tests
- Migration tests: `test/migration.spec.ts` - Database migration tests
- New features: Create dedicated `test/[feature].spec.ts` files

### TDD Checklist:

- [ ] Did you write the test BEFORE the implementation?
- [ ] Does the test name describe WHAT not HOW?
- [ ] Is the test independent (no shared state with other tests)?
- [ ] Did you run the test and see it fail first (Red)?
- [ ] Did you write minimal code to make it pass (Green)?
- [ ] Did you refactor while keeping tests passing?
- [ ] Are all tests passing before committing?

## Unit Testing Rules (CRITICAL)

All unit tests in the `packages/polywise` package MUST adhere to the following rules:

1.    **No Mocks for Models**: Mocking embedding functions or rerankers is STRICTLY PROHIBITED. All tests must use the actual local models (Qwen3-Embedding, BGE-Reranker) to ensure real-world reasoning performance.
2.    **Real-world Datasets**: Tests must use complex, realistic datasets stored in the `test/datasets` directory. Hardcoded simple strings should be replaced with meaningful domain knowledge.
3.    **Concurrency**: Use `describe.concurrent` for all test suites to maximize performance.
4.    **Database Isolation**: Each test must use a unique database name or directory to prevent state leakage between concurrent tests.
5.    **Timeout Handling**: Set appropriate timeouts (e.g., 60s-120s) for tests involving model inference.

## Utils Export Convention (CRITICAL)

All utility functions in `utils/` folders MUST follow this pattern:

### Export Rule:

- Use `export default` with arrow function syntax: `export default () => {}`
- Do NOT write function return type annotations (let TypeScript infer)
- Use anonymous arrow functions (no function name after `default`)

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

## Function & Class Model Parameters Convention

When a function or class constructor has more than 2 parameters, use an object parameter for better flexibility. If there are only 1 or 2 parameters, use positional parameters directly. The parameters must follow these style rules:

- **Parameter Name**: Always use `args` for the object parameter (when there are more than 2 parameters).
- **Type Name**: Always use `*Args` for the interface/type name (e.g., `CreateNodeArgs`).
- **Destructuring**: Always destructure the `args` object at the beginning of the function or constructor.
- **Ordering Rule**: `Required Variables` > `Optional Variables` > `Required Functions` > `Optional Functions`

## Arrow Function Preference

Prefer using arrow functions (`const a = () => {}`) for standalone functions, utility functions, and exported helpers, instead of function declarations (`function a() {}`).

## Type Import Convention (CRITICAL)

Always use `import type` for type-only imports. Avoid inline `import()` statements within interfaces or type definitions. Place all type imports at the top of the file.

## Default Import Convention (CRITICAL)

Always use direct default import syntax `import X from '...'` instead of `import { default as X } from '...'`.

## Named Import Convention (CRITICAL)

**NEVER** use namespace imports (`import * as name from 'module'`). Always use named imports (`import { a, b, c } from 'module'`).

### Rules:

1. **Explicit Named Imports**: Import only what you need using destructuring syntax.
2. **No Namespace Aliases**: Avoid `import * as sql from './sql'` - instead import specific exports like `import { sql_query, sql_insert } from './sql'`.
3. **Benefits**: Better tree-shaking, clearer dependencies, and easier refactoring.

### Example:

```typescript
// WRONG
import * as sql from './sql'
// CORRECT
import { sql_insert, sql_query, sql_update } from './sql'
import * as utils from './utils'
import { calculateSum, formatDate } from './utils'
```

## Final Guarantee

- **Important:** Do not write any comments to explain the code!!! - Do not make modifications to modules that are not mentioned. If you realize that you need to modify pages or modules that are not mentioned, you must confirm with the user before performing the relevant operations.
- Never execute any non-read-only Git commands from the command line at any time.
