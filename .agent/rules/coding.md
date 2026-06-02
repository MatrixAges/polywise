## Foundational Principles (Agent Constitution)

This is the highest constitution you must adhere to when generating any code:

- **Atomicity (Single Responsibility and Physical Isolation)**:
     - A function or component is only allowed to do **one specific thing** (i.e., an "atom").
     - Strictly enforce the "**one atom, one physical file**" principle. It is strictly prohibited to stack multiple unrelated functions or components in a single file.
     - All files must expose their core "atom" via `export default`. The specific export syntax (e.g., arrow function or Class) must strictly follow the matched outline-level route in the current package's `unify.md`.

- **Fractalization (Deep Directory and High Cohesion)**:
     - As business complexity increases, it is strictly prohibited to continuously add new files in the same flat directory (this will lead to code bloat and confusion).
     - When the internal logic of an "atom" becomes complex (e.g., code exceeds 40 lines, or needs to split into multiple sub-logics/sub-components working together), you must **create a deep folder with the same name as the atom in place**.
     - Move the original main logic into the `index.ts/tsx` of that folder, and place the split-out new sub-logics/sub-components within that folder, to be dispatched only by `index`.
     - How to split sub-components for components and how to cluster functions into same-name folders, **must be inferred from the matched outline-level route and its sample files in the current package's `unify.md` before performing code generation**.
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

- **Naming Conventions**: All ordinary variables must use `snake_case`, all functions and methods must use `camelCase`, frontend component props parameters and prop field names must use lower camelCase starting with a lowercase letter by default, but all component props parameters and prop field names under `packages/app/pages` must use `snake_case`, and all component and page files must use `PascalCase`.
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
- **Frontend Sample Learning**: Before writing or refactoring frontend pages/components, you must first read and learn a nearby mature sample in the same package and follow its import order, hooks placement, props organization, render segmentation, and export wrapping style. For frontend work under `packages/app`, the preferred sample path is `packages/app/components/Session`.
- **Frontend State Ownership**: Page-level data loading, pagination, scroll handling, selection switching, and other data-affecting event functions must be defined in the page `model`, not scattered across presentational components.
- **Frontend Props Assembly**: When passing multiple props to a component, especially when functions are included, you must first assemble them into a typed props object and then render the component through props spreading.
- **Frontend Split Restraint**: Component splitting must stay minimal and cohesive. If a composite UI only contains a small number of stable sections, prefer one entry component plus a few section components in the same folder. Do not split simple list items or buttons into separate files unless they have independent state, reuse value, or clearly complex structure.
- **Function Naming Priority**: All functions, methods, and event handlers must use `camelCase`. Snake case is allowed for ordinary variables, but never for function names or event handler names.

### TypeScript Specifications

- **Type-First Design**: Before writing business logic, first define reusable data structures and function type signatures in English. Implementation must then be built around that reusable type system instead of growing from ad hoc inline shapes.
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
- **Barrel Exports**: All single-file functions in a directory `index.ts` barrel file must be exported using the direct syntax `export { default as fnName } from './fnName'`, instead of importing first and then exporting.

### Database and SQL

- **Globally Unique IDs**: All primary keys (id) and foreign key fields in database tables must use `uuidv7()` to generate string types. It is strictly prohibited to use database auto-increment Int types.
- **SQL Isolation**: All SQL query strings must be stored in files under the `src/sql/` directory. Hard-coded SQL strings in business code will be considered a violation.
- **SQL Comments**: Above every SQL variable or function exported from `src/sql/`, a JSDoc comment must be attached, detailing which table the statement operates on and what action it belongs to.

### Node.js API Specifications

- **File System**: Business code should use `fs-extra` for local file-system operations. Exception: automation scripts under the workspace-root `scripts/` directory should prefer native `node:fs` or `node:fs/promises` APIs instead of `fs-extra`.
- **No node Prefix**: Business code should not add the `node:` prefix when importing Node.js built-ins such as `path` or `crypto`. Exception: automation scripts under the workspace-root `scripts/` directory may use `node:`-prefixed built-ins, and should use `node:fs` or `node:fs/promises` for file-system access.
