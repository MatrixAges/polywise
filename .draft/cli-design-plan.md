# Polywise CLI: Design Proposal and Execution Plan

Last Updated: 2026-05-22

## Objectives

Design—and subsequently implement—a set of reusable CLI capabilities within the `packages/polywise/src/cli/` directory, covering two distinct pathways:

1.    **Frontend Pathway:** Register a `page_tool` with the `global_panel_session` to support progressive disclosure of information:

- Available pages/panels
- The currently active page
- Navigation methods (how to switch pages)
- Visible DOM elements / semantic summaries of the current page

2.    **Backend Pathway:** Transform exposed RPCs into CLI-callable API capabilities, adhering to the following workflow:

- `rpc -> openapi -> api_map -> cli`
- `subscribe`-type RPCs will _not_ be included in the initial release of the CLI exposure.
- Register an `api_tool` with the `global_panel_session`.
- Both the `api_tool` and the terminal CLI must support multi-level `-h` (help) flags, enabling progressive disclosure via indexing rather than dumping the entire API surface to the AI ​​at once.

This document outlines the design proposal and execution plan only; it does not include the actual implementation code.

---

## Current Baseline

### Confirmed Code Status

- The `packages/polywise/src/cli/` directory is currently empty, making it an ideal candidate for building the structure from scratch. - The server currently hosts:
- `/trpc/*`: The original tRPC endpoints.
- `/api/*`: OpenAPI handlers generated via `trpc-to-openapi`.
- `/sys/*`: A small set of Hono APIs (currently consisting mainly of session SSE / IM webhooks).
- `global_panel_session` already exists and is directly mounted by the frontend panel:
- [packages/app/panel/session/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/panel/session/index.tsx)
- The actual entry point for the current app routing is located at:
- [packages/app/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/index.tsx)
- The actual entry point for the current panel tabs is located at:
- [packages/app/appdata/panel.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/appdata/panel.tsx)
- The current tRPC metadata is declared solely as `OpenApiMeta`:
- [packages/polywise/src/utils/trpc.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/utils/trpc.ts)
- Currently, only a few RPCs have been explicitly tagged with `meta.openapi`; the majority of business-logic RPCs have not yet been exposed via the OpenAPI interface.

### Facts Directly Relevant to This Requirement

- `session.init` supports the `global: true` option; therefore, `global_panel_session` serves as a natural mounting point for global tools.
- `global_panel_session` has already been excluded from the standard list of sessions, ensuring it does not clutter the regular session pages.
- The actual DOM resides within the frontend app process/browser environment; the server cannot directly access the React DOM.
  This implies that `page_tool` cannot be implemented entirely within the confines of the `polywise` server; it requires a bridging mechanism on the app side. ### Explicit Exclusions for the Initial Release

- CLI wrappers for all `subscription` RPCs
- Return of the full raw DOM
- Enabling the AI ​​to view the entire page, all APIs, and all parameter details simultaneously
- Default registration of `page_tool` / `api_tool` within standard sessions

---

## Design Principles

### 1. Progressive Disclosure Over Full Enumeration

Whether via `page_tool`, `api_tool`, or the terminal command `polywise ... -h`, the root node exposes only a single level of indexing:

- Top-level categories
- Brief summaries
- Guidance on how to query the next level

Subsequent commands, pages, parameters, or DOM summaries are returned only when the caller chooses to drill down further.

### 2. Shared Indexing Model

The terminal CLI and the AI ​​tools must not maintain separate sets of help documentation.

The following components should be abstracted into a unified system:

- `page_map`
- `api_map`
- `help index renderer`
- `command resolver`

This ensures that the terminal `-h` flag and the `page_tool/api_tool action=help` command remain inherently consistent.

### 3. Front-end Page Capabilities Must Rely on Bridging, Not Guesswork

The server-side can only know "which pages are defined"; it cannot see "which page the user currently has open" or "what the current DOM structure is."

Therefore, the system must be split into two layers:

- Static Page Registry: Defines which pages/panels exist and what parameters they accept.
- Runtime Page State Bridge: Captures the current route, active panel tab, visible sections, and a semantic snapshot of the DOM.

### 4. OpenAPI as the Prerequisite for Backend CLI Integration

Only non-subscription RPCs that possess a `meta.openapi` definition are eligible for inclusion in the `api_map`.

This ensures that:

- The HTTP invocation path is clearly defined.
- The CLI can directly reuse the defined paths, methods, and input parameters.
- The exposed surface area remains controllable.

### 5. Initial Release Priority: "Enumerable, Navigable, Callable, and Documented"

The initial release will _not_ prioritize:

- Automatically generating highly elaborate "man pages."
- Creating a comprehensive documentation site based on full schemas.
- Enabling control over every single component-level action within the front-end.

Instead, the focus is on first establishing a minimal yet complete closed-loop workflow. ---

## Overall Architecture

### Layering

```text
frontend app runtime
-> page registry
-> page runtime bridge
-> page_map
-> page_tool / page CLI

backend rpc
-> openapi meta
-> api_map builder
-> shared help index
-> api_tool / api CLI
```

### Suggested Directory Structure

```text
packages/polywise/src/cli/
index.ts
types.ts
shared/
help.ts
tree.ts
render.ts
api/
meta.ts
collect.ts
apiMap.ts
call.ts
help.ts
page/
pageMap.ts
registry.ts
bridge.ts
help.ts
commands/
api.ts
page.ts
root.ts
```

Suggested additions on the App side:

```text
packages/app/
appdata/page.ts
runtime/pageBridge.ts
runtime/pageSnapshot.ts
```

> Static registration of `pages` can be maintained within the App; ultimately, this data can be synchronized to the server via a bridge, or the App can respond directly to queries from the `page_tool`.

---

## Backend Pipeline Design: `rpc -> openapi -> api_map -> cli`

## 1. Extending RPC Metadata

The current definition `p = initTRPC.meta<OpenApiMeta>()` is too narrow and insufficient to describe the hierarchical structure of the CLI help documentation.

It is suggested to change it to:

```ts
type CliProcedureMeta = {
	cli?: {
		group?: string[]
		name?: string
		summary?: string
		hidden?: boolean
		examples?: string[]
	}
}

type ProcedureMeta = OpenApiMeta & CliProcedureMeta
```

Then, consistently use `ProcedureMeta` throughout [packages/polywise/src/utils/trpc.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/utils/trpc.ts). ### Objectives

- `openapi` governs HTTP exposure.
- `cli` governs the display of the command tree and help text.
- Both coexist within the same procedure metadata.

## 2. OpenAPI Exposure Strategy

The initial version includes only:

- `query`
- `mutation`
- And procedures where `meta.openapi` has been explicitly defined.

Explicitly excluded are:

- `subscription`
- Procedures used solely for internal frontend event bridging.
- "Watch-style" interfaces requiring long-lived connections or real-time push notifications.

### Recommended Rules

- `watch*`, `progress`, and `heartbeat subscription` procedures are excluded from the CLI by default.
- If a namespace contains both `query`/`mutation` and `subscription` procedures, only the former are included.

## 3. `api_map` Structure

The `api_map` serves as the sole index of backend capabilities for both the CLI and `api_tool`.

Recommended structure:

```ts
interface ApiMapItem {
	id: string
	rpc_path: string
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	openapi_path: string
	cli_path: string[]
	group_path: string[]
	summary: string
	input_hint: string[]
	examples: string[]
	hidden?: boolean
}
```

Example:

```ts
{
id: 'session.create',
rpc_path: 'session.create',
method: 'POST',
openapi_path: '/session/create',
cli_path: ['api', 'session', 'create'],
group_path: ['session'],
summary: 'Create a new session',
input_hint: ['--title <text>', '--project-id <id>'],
examples: ['polywise api session create --title "Daily Review"']
}
```

## 4. `api_map` Construction Method

It is recommended _not_ to manually write the entire table. Should be automatically collected from the router:

1. Iterate through the `router` records.
2. Identify the following for each procedure:

- Type: query / mutation / subscription
- `meta.openapi`
- `meta.cli`

3. Filter out subscriptions.
4. Generate `a`.`api_map`

### Benefits of This Approach

- Adding a new RPC to the CLI requires only supplementing its metadata; there is no need to modify two separate tables.
- The CLI's exposed interface remains aligned with the OpenAPI specification.
- This structure can be reused later for automated documentation generation.

## 5. `api_tool` Design

The `api_tool` is registered exclusively within the `global_panel_session`.

Suggested Actions:

- `help`
- `list`
- `schema`
- `call`

### `help`

Purpose: To provide a multi-level hierarchical help index.

Examples:

- `help()`: Returns only the top-level groups (e.g., `session`, `project`, `agent`, `post`).
- `help({ path: ['session'] })`: Returns the commands available under the `session` group.
- `help({ path: ['session', 'create'] })`: Returns a summary of the specific command, parameter hints, and usage examples.

### `list`

Purpose: To perform fuzzy filtering based on keywords or groups, with the number of default results capped at a reasonable limit.

### `schema`

Purpose: To expose parameter details only when specifically requested, rather than dumping all available fields in the root-level help output.

The returned content should be a "compressed schema summary"—not a verbatim dump of the entire Zod or OpenAPI schema directly to the model.

### `call`

Purpose: To execute a specific API endpoint.

Workflow:

1.    The `api_tool` locates the target API endpoint using the `api_map`.
2.    It validates whether the target endpoint is permitted for CLI invocation.
3.    It normalizes the input parameters.
4.    It calls the `/api/*` endpoint using a unified HTTP client.
5.    It returns the compressed JSON result.

## 6. Terminal CLI Design

Suggested Top-Level Entry Points:

```bash
polywise api -h
polywise api session -h
polywise api session create -h
polywise api session create --title "Daily Review"
```

### Core Principles

- The `-h` (help) flag is rendered by a shared help engine.
- CLI command parsing is also driven by the `api_map`.
- It avoids reliance on hard-coded, multi-level command definitions.

### Why a Custom Help Engine is Recommended

Because the primary objective here is not merely the ability to "parse commands," but rather the capability for "hierarchical indexing and disclosure." Conventional CLI frameworks excel at handling static command trees; however:

- `api_tool` also needs to share the same set of help documentation.
- Page-related tools must likewise utilize this same help mechanism.

Therefore, a more logical approach is to:

- Build a custom, lightweight command tree.
- Treat both the CLI and the tools merely as different entry points into this shared structure.

---

## Frontend Workflow Design: `page_map -> page runtime bridge -> page_tool`

## 1. Why Are Two Layers of Page Functionality Necessary?

Relying solely on the file system or React routing definitions allows us to identify _which pages exist_;
however, user requirements extend beyond this to include:

- The currently active page.
- The mechanism for navigating between pages.
- The current DOM content.

These specific requirements are entirely dependent on runtime state. Therefore, it should be split into:

1. Static `page_map`
2. Runtime `page_bridge`

## 2. `page_map` Structure

It is recommended that this cover two categories of entities:

- Route pages
- Panel pages

Suggested structure:

```ts
interface PageMapItem {
	id: string
	kind: 'route' | 'panel'
	title: string
	parent_id?: string
	route_path?: string
	panel_tab?: string
	summary: string
	params_hint: string[]
	children?: string[]
}
```

Suggested static sources for the initial version:

- Routes: Aligned with the actual routes defined in [packages/app/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/index.tsx)
- Top Navigation: Sourced from `nav_items`
- Panels: Sourced from [packages/app/appdata/panel.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/appdata/panel.tsx)

### Suggested Root Indices for Pages (Initial Version)

- `home`
- `session`
- `agent`
- `linkcase`
- `post`
- `setting`
- `panel.session`
- `panel.bookmark`
- `panel.pipeline`
- `panel.notification`

### Dynamic Pages

Pages such as `/post/:id` should be structured as template nodes:

- `post.detail`
- Parameter Hint: `id`

Rather than generating a static page ID for every individual post instance. ## 3. `page_bridge`: Runtime Bridge

### Objective

To enable the server/AI to access the app's current actual state:

- Current route
- Route parameters
- The active tab of the current panel
- Visible sections on the current page
- A semantic DOM summary of the current page

### Proposed Implementation

The app side maintains a "runtime bridge" that updates the following state periodically or via event triggers:

```ts
interface PageRuntimeSnapshot {
	route: {
		pathname: string
		params: Record<string, string>
		search: Record<string, string>
	}
	panel: {
		active_tab: string | null
	}
	page_id: string | null
	visible_sections: Array<{
		id: string
		title: string
		kind: 'heading' | 'list' | 'form' | 'editor' | 'chat' | 'detail'
		summary: string
	}>
	actions: Array<{
		id: string
		label: string
		kind: 'navigate' | 'click' | 'input'
	}>
}
```

## 4. DOM Exposure Strategy

It is not recommended to return the entire page's `innerHTML` directly in the initial release.

A three-tiered approach is recommended:

### Level 1: Semantic Summary

Returned by default:

- Page title
- List of sections
- A brief summary for each section
- List of actionable items

### Level 2: Structured Visible Content

Returned when requested on a per-section basis:

- Headings
- Visible labels
- List items
- Excerpt of selected text

### Level 3: Restricted Raw DOM Excerpt

Returned only upon explicit request:

- Trimmed HTML/text for a specified section
- Subject to a character limit

### Recommended Annotations

Gradually add stable markers to key pages; for example:

- `data-page-id`
- `data-page-section`
- `data-page-action`

This ensures that the `page_tool` reads the "product's semantic structure" rather than relying on a fragile tree of CSS class names. ## 5. Page Navigation Capabilities

The initial release of `page_tool` is proposed to support:

- Route navigation
- Panel tab switching

Suggested actions:

- `help`
- `list`
- `current`
- `inspect`
- `navigate`
- `back`

### `current`

Returns Level 1 information regarding the current page snapshot.

### `inspect`

Drills down by page or section to return Level 2/3 information.

### `navigate`

Supports two types of targets:

- Route targets: e.g., `session`, `post.detail`
- Panel targets: e.g., `panel.notification`

If a target requires parameters, the `help` action should first provide a prompt, after which `navigate` accepts the parameters.

## 6. `page_tool` Registration Scope

`page_tool` is attached exclusively to `global_panel_session`. Rationale:

- This capability is designed for app-wide global navigation, rather than being a private feature exclusive to a specific, standard conversation session.
- This prevents the "tooling surface" of standard sessions from being cluttered by unrelated UI operations.

---

## Progressive Disclosure and the Multi-Layer `-h` Mechanism

## 1. Unified Tree Model

Both `api` and `page` are abstracted into a single "help tree":

```ts
interface HelpNode {
	id: string
	title: string
	summary: string
	kind: 'root' | 'group' | 'command' | 'page' | 'section'
	children?: string[]
	examples?: string[]
	hints?: string[]
}
```

## 2. Root Nodes Expose Only the First Level

Example:

### `polywise api -h`

Displays only:

- Available namespaces
- A one-sentence summary for each namespace
- Next steps/suggestions: `polywise api <namespace> -h`

### `api_tool.help()`

Displays only:

- `session`
- `project`
- `post`
- `agent`
- ...

### `polywise page -h`

Displays only:

- Route pages
- Panel pages
- `current` / `inspect` / `navigate`

## 3. Second-Level Nodes Display Commands, Not Full Parameter Details

For example:

```bash
polywise api session -h
```

Returns:

- `create`
- `rename`
- `remove`
- `get-list`
- ...

Each command is accompanied by only a one-sentence summary. ## 4. Displaying Parameters and Examples at the Third-Level Node

For example:

```bash
polywise api session create -h
```

Only then are the following displayed:

- Parameters
- Default values
- Examples
- Output summary

## 5. Significance for AI

This mechanism prevents:

- The context window from being consumed by a lengthy list of APIs
- The model from encountering irrelevant commands prematurely
- Unclear navigation paths for pages or APIs

---

## Integration with the Existing Session Tool Runtime

## 1. Mount Point

In [packages/polywise/src/fst/session/stream/getStream.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/fst/session/stream/getStream.ts), add additional tool injection conditions for `global_panel_session`.

Suggested Logic:

- Standard sessions: Maintain current behavior
- `global_panel_session`: Augmenting the shared runtime with:
- `page_tool`
- `api_tool`

## 2. It is not recommended to make tools shared by default across all sessions.

Reasons:

- This would significantly expand the tool surface area for standard sessions.
- UI navigation and global API operations do not constitute the minimum essential capabilities required for the majority of sessions.

## 3. Relationship with the existing `meta_tool`

`meta_tool` handles custom tool routing; it is not suitable for serving as the framework for exposing system APIs via a CLI interface. Therefore:

- `meta_tool` continues to be responsible for custom tools.
- `api_tool` is responsible for system business APIs.
- The responsibilities of the two are kept separate.

---

## Recommended Implementation Steps

## Phase 0: Basic Metadata and Shared Tree Model

**Goal:**

- Define common CLI types.
- Extend tRPC meta types.
- Define data structures for the `help tree`, `api_map`, and `page_map`.

**Deliverables:**

- `src/cli/types.ts`
- `src/cli/shared/*`
- `utils/trpc.ts` (meta extensions)

**Acceptance Criteria:**

- It is possible to construct the `help tree` without integrating specific commands.

## Phase 1: Backend `api_map` Construction

**Goal:**

- Automatically collect non-subscription OpenAPI procedures from the router.
- Generate the `api_map`.

**Deliverables:**

- `src/cli/api/collect.ts`
- `src/cli/api/apiMap.ts`

**Acceptance Criteria:**

- The initial batch of RPCs tagged with `meta.openapi` can be listed.
- `subscription` procedures do not appear in the results.

## Phase 2: Terminal `api` CLI and `api_tool`

**Goal:**

- Enable the `polywise api ...` command.
- Enable `api_tool.help/schema/call` functionality.

**Deliverables:**

- `src/cli/commands/api.ts`
- `src/fst/tools/api.ts`

**Acceptance Criteria:**

- `polywise api -h` works.
- `polywise api <namespace> -h` works.
- `polywise api <namespace> <command> -h` works.
- The tree structure output by `api_tool` is consistent with that of the CLI.

## Phase 3: App-side `page_map` and Runtime Bridge

**Goal:**

- Establish a static index for pages.
- Establish a bridge for the current page's state.

**Deliverables:**

- `packages/app/appdata/page.ts`
- `packages/app/runtime/pageBridge.ts`
- A bridging interface on the server side for receiving/reading the current page state.

**Acceptance Criteria:**

- The current route can be read.
- The current panel tab can be read.
- Summaries of page sections can be retrieved.

## Phase 4: `page_tool` and the Page CLI

**Objectives:**

- Inject `page_tool` into the `global_panel_session`.
- Provide the `polywise page ...` command interface.

**Deliverables:**

- `src/fst/tools/page.ts`
- `src/cli/commands/page.ts`

**Acceptance Criteria:**

- `polywise page -h` executes successfully.
- `polywise page current` executes successfully.
- `polywise page navigate ...` executes successfully.
- `page_tool.current/inspect/navigate` functions correctly.

## Phase 5: Expansion and Governance

**Objectives:**

- Populate `meta.openapi` and `meta.cli` for additional RPCs.
- Add `data-page-*` markers to key pages.
- Refine and complete test coverage.

**Acceptance Criteria:**

- The workflow for integrating new RPCs into the CLI is stable.
- Page summaries are consistently available and reliable on key pages.

---

## Risks and Key Decisions

## 1. Risk: Current OpenAPI Coverage Is Too Low

Currently, only a small number of RPCs are included in `meta.openapi`.

**Impact:**

- The initial release of `api_map` will have limited scope and utility.

**Mitigation:**

- First, establish and validate the end-to-end workflow.
- Then, populate the `meta` data based on priority, rather than requiring full coverage upfront.

## 2. Risk: Front-end DOM Summarization Will Be Extremely Fragile If It Directly Scans the DOM

**Impact:**

- Changes to CSS class names could easily cause the page summary to become inaccurate or "drift."

**Mitigation:**

- The initial release will focus primarily on page registration and semantic sections.
- `data-page-*` markers will be added to key pages incrementally over time.

## 3. Risk: An Overly Heavy CLI Framework Could Conflict with the "Shared Help Engine"

**Mitigation:**

- Prioritize developing a lightweight, custom layer for the help tree and command parsing logic.
- External frameworks should serve solely as the entry point for command-line arguments (`argv`) and should not host the help system itself.

## 4. Key Decision: `page_tool` Will Be Attached _Only_ to the `global_panel_session`

This establishes the correct scope and boundaries.

If future requirements demonstrate that other agents or sessions also require page manipulation capabilities, we can enable that functionality separately at that time; we should avoid over-generalizing the design from the outset. ---

## Proposed Scope for Initial API and Page Inclusion

## APIs

It is recommended to prioritize simple, synchronous, and non-watch capabilities first:

- `session.create`
- `session.rename`
- `session.remove`
- `project.list`
- `tool.query`
- `home.query`
- `post.query`
- `post.read`

Prerequisite: Complete the `meta.openapi` definitions.

## Pages

It is recommended to cover stable main routes first:

- `/`
- `/session`
- `/agent`
- `/linkcase`
- `/post`
- `/setting`
- `panel.session`
- `panel.notification`

Dynamic detail pages—such as `/post/:id`—should be deferred to the second batch.

---

## Suggested Format for Review Conclusions

When reviewing this proposal, you may provide one of the following conclusions directly:

1.    **Feasible:** Proceed according to Phases 0–2 of this draft, prioritizing the backend CLI and `api_tool`.
2.    **Feasible:** Proceed with the full scope as outlined in this draft.
3.    **Narrow Scope:** Focus solely on the `api_tool` for now, deferring the `page_tool`.
4.    **Narrow Scope:** Focus only on the `list`/`current`/`navigate` functions of the `page_tool`, excluding DOM inspection capabilities.
5.    **Revision Required:** I need to revise the draft first, with a specific focus on adjusting:

- The granularity of the `page_tool`.
- The generation method for the `api_map`.
- The structure of multi-level `-h` (help) outputs.
- The mounting boundaries for `global_panel_session`.

---

## Conclusion

This requirement is best addressed by establishing a "Shared Index Layer," rather than writing separate, distinct implementations for the terminal, OpenAPI, AI tools, and the frontend bridge.

The three most critical focal points are:

1.    **Extend Procedure Metadata:** Ensure that `openapi` and `cli` metadata originate from a single, unified source.
2.    **Establish a Unified Index Layer:** Designate the `api_map` and `page_map` as the sole, authoritative index layer.
3.    **Define `page_tool` Access:** Explicitly mandate that the `page_tool` must access current page data and DOM summaries exclusively through the App Runtime Bridge.

As long as these three core decisions remain aligned, the subsequent implementation can proceed in stages without the need for rework.
