## Unify Rules: Entropy Limitation and Code Style Unification Specification

**1. Core Principles**
Strictly limit code "entropy increase" during project evolution. When generating any new code, the Agent must follow the "cloning" programming principle, which means completely reusing the code structure, naming conventions, state management patterns, and logical organization order of existing modules of the same type, and avoiding any "innovative" writing style that deviates from existing specifications.

**2. Style Route Maintenance (`unify.md`)**
The Agent is responsible for maintaining `unify.md` in the project directory (or monorepo sub-package directory), which serves as a global code style routing and status table in Tree JSON format.

- **Input and Output:** When scanning current files or generating new files, the Agent needs to dynamically extract code features, categorize files (e.g., UI components, data model services, etc.), and supplement the routing and style descriptions into the Tree JSON.
- **Structure Details:** The nodes of the JSON tree must contain: module category name, abstract style description (e.g., error handling patterns, dependency injection specifications), and a pool of specific reference file paths belonging to that category.

**3. Agent Standard Operating Procedure (SOP)**
Before performing code generation, the Agent must strictly follow the sequence of the following constrained steps:

- **Step 1: Route Addressing** - Read and parse the Tree JSON in `unify.md`, and infer the module type node that the target code belongs to based on the current requirements.
- **Step 2: Extract Style** - From the matched node, obtain the Unify Style rule description specific to that module.
- **Step 3: Obtain Main Sample** - Read the `Same Code 1` (first reference file) under that category, perform deep structural analysis, and accurately capture its import order, variable naming paradigms, and function skeletons.
- **Step 4: Pixel-Level Imitation** - Use `Same Code 1` as an absolute physical template, accurately inject new business logic into this fixed skeleton, and perform code generation.
- **Step 5: Specification Review** - After completing the initial draft, the Agent must self-review against the Unify Style from Step 2 to ensure no non-standard advanced syntax or architecture-violating writing styles are introduced.
- **Step 6: Anti-Overfitting Verification** - Force reading of `Same Code 2` (second reference file) under the same category. Perform triangular comparison between the generated code and both samples: ensure the new code learns the "general pattern" of the module, rather than blindly copying business hardcoding specific to `Same Code 1` (such as specific magic numbers or specific field names). If overfitting is detected, return for refactoring.
