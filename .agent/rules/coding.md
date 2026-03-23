## Foundational Principles (Agent Constitution)

This is the highest constitution you must adhere to when generating any code:

- **Atomicity (Single Responsibility and Physical Isolation)**:
     - A function or component is only allowed to do **one specific thing** (i.e., an "atom").
     - Strictly enforce the "**one atom, one physical file**" principle. It is strictly prohibited to stack multiple unrelated functions or components in a single file.
     - All files must expose their core "atom" via `export default`. The specific export syntax (e.g., arrow function or Class) must strictly follow the `unify.md` file of the current directory's package.

- **Fractalization (Deep Directory and High Cohesion)**:
     - As business complexity increases, it is strictly prohibited to continuously add new files in the same flat directory (this will lead to code bloat and confusion).
     - When the internal logic of an "atom" becomes complex (e.g., code exceeds 40 lines, or needs to split into multiple sub-logics/sub-components working together), you must **create a deep folder with the same name as the atom in place**.
     - Move the original main logic into the `index.ts/tsx` of that folder, and place the split-out new sub-logics/sub-components within that folder, to be dispatched only by `index`.
     - How to split sub-components for components and how to cluster functions into same-name folders, **must be read and strictly emulated from the "fractal rules" defined in `unify.md` in the current project or sub-module directory before performing code generation**.
     - The generated code must present a tree-like, highly cohesive hierarchical structure, ensuring extremely high readability and maintainability, and eliminating "noodle-style" code that is written wherever one thinks.

## Coding Standards

For development targeting different tech stacks and code modules, please strictly use the specific skill guides under `@.opencode/skills/`:

- **TypeScript**: [typescript/SKILL.md](../../.opencode/skills/typescript/SKILL.md)
- **React**: [react/SKILL.md](../../.opencode/skills/react/SKILL.md)
- **MobX**: [mobx/SKILL.md](../../.opencode/skills/mobx/SKILL.md)
- **Tailwind CSS**: [css/SKILL.md](../../.opencode/skills/css/SKILL.md)
- **i18n**: [i18n/SKILL.md](../../.opencode/skills/i18n/SKILL.md)
- **eRPC Communication**: [erpc/SKILL.md](../../.opencode/skills/erpc/SKILL.md)

### Naming and Formatting

- **Naming Conventions**: All ordinary variables must use `snake_case`, all functions and methods must use `camelCase`, and all component and page files must use `PascalCase`.
- **No Underscores**: The naming of any function or method (including private methods within a class) absolutely cannot start with the `_` symbol.
- **Type Notation**: When declaring array types, the `Array<T>` generic syntax must be strictly enforced, and the `T[]` syntax is strictly prohibited.
- **Code Blank Lines**: When adjacent lines of code switch between async/sync styles or execute different logical blocks, a blank line must be forcibly inserted for visual separation.
- **No Comments**: Generated code is strictly prohibited from containing any explanatory comments in Chinese or English. Business intent must be conveyed through highly descriptive variable and function names.

### Architecture and Design

- **Single Responsibility**: Files under `models/` are only allowed to contain state and data fetching logic, `components/` only for UI rendering logic, and `utils/` only for pure functions with no external dependencies.
- **Atomic Logic**: When a single function's code exceeds 40 lines, it must be split into multiple independent small functions; DOM structures inside `map` loops in JSX must be extracted and created as a new sub-component.
- **Dependency Injection**: All external dependencies of classes must be injected through constructors and `tsyringe`. It is strictly prohibited to have forced instantiation patterns like `new ClassName()` in business code.
- **File Splitting**: When a single component file exceeds 80 lines, a `components/` folder must be created in the same-level directory, and the internal block components must be split into it with short, prefix-free names.
- **Function Order**: Inside a Class, the physical order must strictly be `constructor` -> `init` -> `public methods` -> `private methods` -> `helper functions` -> `off`, and empty functions with no content are strictly prohibited.

### TypeScript Specifications

- **No Any**: The `any` type declaration is strictly prohibited in code. For uncertain types, forcefully declare as `unknown` and use typeof/instanceof and other type narrowing mechanisms.
- **Type Inference**: Except for exported complex public APIs, manually declaring function return value types is prohibited; all type inference is left to the TS compiler.
- **Type Imports**: When importing Types or Interfaces, the `import type` syntax must be used, and such imports must be placed at the very top block of the target file.
- **Arrow Functions**: All business components, utility functions, and independent functions must be declared in `const fn = () => {}` format, and the `function fn() {}` syntax is prohibited.
- **Function Parameters**: When a function has 3 or more parameters, the parameters must be merged into a single object named `args`, and the `args` must be destructured on the first line of the function body.
- **Type Files**: When a single `.ts` type file exceeds 50 lines, it must be split into multiple files by business domain; if there are multiple scattered type files under 20 lines in a directory, they must be merged into one.

### Modules and Import/Export

- **Default Export**: Each Class must occupy a single physical file, and must be exported at the very end of the file using `export default ClassName`.
- **Utils Export**: All utility functions under the `utils/` directory must use the anonymous arrow function format `export default () => {}` for exporting.
- **Named Imports**: It is strictly prohibited to use `import * as name` for full imports. The precise destructuring syntax `import { a, b } from 'pkg'` must be used for on-demand imports.
- **Default Imports**: When importing a default module, directly use `import X from 'pkg'`. It is strictly prohibited to write it with an alias like `import { default as X } from 'pkg'`.

### Database and SQL

- **Globally Unique IDs**: All primary keys (id) and foreign key fields in database tables must use `uuidv7()` to generate string types. It is strictly prohibited to use database auto-increment Int types.
- **SQL Isolation**: All SQL query strings must be stored in files under the `src/sql/` directory. Hard-coded SQL strings in business code will be considered a violation.
- **SQL Comments**: Above every SQL variable or function exported from `src/sql/`, a JSDoc comment must be attached, detailing which table the statement operates on and what action it belongs to.

### Testing Specifications (TDD)

- **Test-Driven Development (TDD)**: When developing features in `packages/polywise`, you must first write test code and confirm it fails (Red), then write business code to make it pass (Green).
- **Real Models**: In tests, it is strictly prohibited to Mock responses from local large models (such as embedding or reranking models). You must forcefully introduce real inference libraries and use real datasets for assertions.
- **Test Isolation**: When writing multiple test cases, `describe.concurrent` must be used for concurrent execution, and each case must be assigned an independent database name or isolated directory during initialization to prevent state pollution.

### Node.js API Specifications

- **File System**: All operations involving the local file system must introduce the third-party library `fs-extra` for processing. Using the native `fs` or `fs/promises` modules is strictly prohibited.
- **No node Prefix**: When introducing Node.js native built-in modules (such as `path`, `crypto`), the import path is strictly prohibited from adding the `node:` character prefix.
