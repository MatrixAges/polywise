# Agent-Specific Knowledge + Import/Export Solution

Last Updated: 2026-05-24

## Goal

To augment the capabilities of "real-world digital twin agents" in two key areas:

1.    In addition to linking to articles from the global knowledge base, the agent should support "agent-specific knowledge."
2.    The agent should support import and export functionality, exporting data in the format `[agent name].papk`.

The typical use case here is not a general-purpose Q&A agent, but rather a digital twin of a real-world figure—such as "Hu Chengfeng." The solution focuses on the following principles:

- Avoid polluting the global knowledge base.
- Maintain clear boundaries for knowledge retrieval.
- Maintain clear boundaries for the knowledge graph.
- Ensure the exported package (`.papk`) is portable, replayable, and cleanable.

---

## Conclusion First

It is recommended to directly reuse the existing `article.scope_type / scope_id` fields to define the ownership boundaries for "agent-specific knowledge":

- `article.scope_type = 'global'`: Global knowledge.
- `article.scope_type = 'agent'` and `scope_id = agent.id`: Agent-specific knowledge.
- `agent_article` continues to serve its original purpose: indicating that "this agent is linked to a specific global article."

In other words:

- "Agent-specific knowledge" is defined via `article.scope_*`.
- "Linked articles" are defined via `agent_article`.

This approach completely decouples "ownership" from "linking," resulting in the most semantically stable design.

Regarding import and export, the strategy is shifted to a "complete snapshot package" model:

- Export the agent's own core data.
- Export all associated data—including articles, chunks, vectors, nodes, edges, and relations—that are visible to the agent and required for migration alongside it.
- During the import process, prioritize restoring the original snapshot rather than regenerating the data from scratch.

This ensures that the imported agent constitutes a complete digital twin replica, independent of whether the target environment already contains the corresponding global knowledge. ---

## Current State Baseline

### Existing Foundations

- The `article` table already includes the fields `scope_type: global | project | agent` and `scope_id`.
- Under an agent session, `content_tool.save` already writes content with `scope_type='agent'`.
- `agent_article` already supports associating agents with articles.
- `node` / `edge` tables already possess an `agent_id` field, capable of hosting agent-specific knowledge graphs.
- The `archiver` is already located within `packages/polywise/package.json`.

### Current Issues

The current implementation is in a state where "the backend possesses half the capability, but the product semantics have not yet formed a closed loop":

1. `agent_article` currently covers only "association," but does not cover "exclusivity" (agent-specific content).
2. Agent-specific articles currently lack a complete UI.
3. `linkcase` lacks entry points for "assigning to an agent" or "associating with an agent."
4. Global queries for posts, the homepage, and analytics do not systematically exclude articles where `scope_type='agent'`.
5. Knowledge graph recall remains biased toward global scope; the boundaries for nodes/edges belonging to agent-private articles have not yet been sufficiently tightened.
6. There is currently no workflow for importing or exporting agent-specific data.

---

## I. Agent-Specific Knowledge Solution

## 1. Core Semantics

Knowledge is categorized into two types:

### A. Global Knowledge

- Any agent may potentially retrieve this knowledge.
- Article records are stored as:
- `scope_type = 'global'`
- `scope_id = null`
- If a specific agent wishes to "bookmark" or "associate" such an article, it utilizes the `agent_article` mechanism.

### B. Agent-Specific Knowledge

- Only a specific agent's `content_tool` or search function can retrieve this knowledge.
- Article records are stored as:
- `scope_type = 'agent'`
- `scope_id = <agent_id>`
- This type of knowledge no longer relies on `agent_article`.

These two capabilities correspond directly to your two distinct requirements:

- "Adding associated articles from the global knowledge base" -> `agent_article`
- "Agent-specific knowledge" -> `article.scope_type='agent'`

---

## 2. "Assignment" vs. "Association" in Linkcase

### Semantic Recommendations

For articles with `for='linkcase'`, two types of actions are supported:

### 2.1 Assignment

Meaning:

- Transforms a "linkcase" article into exclusive knowledge belonging to a specific agent.
- Can be assigned to only one agent at a time.
- Once assigned, only that specific agent can retrieve the article via `content_tool` or search queries.

Database Implementation:

- Update the article record:
- Set `scope_type = 'agent'`
- Set `scope_id = target_agent_id`

Constraints:

- An article in the "assigned" state cannot subsequently be "associated with multiple agents."
- To avoid semantic conflicts, any existing `agent_article` relationships linked to the article must be cleared during the assignment process.

### 2.2 Association

Meaning:

- Retains the article's status as global "linkcase" knowledge.
- Allows multiple agents to link to the article as reference material.

Database Implementation:

- Maintain the article record:
- Keep `scope_type = 'global'`
- Keep `scope_id = null`
- Add or remove entries in the `agent_article(agent_id, article_id)` relationship table.

Constraints:

- Only articles in the "global" state are eligible to be "associated with an agent."
- If an article is currently in the "assigned" state, the option to associate it should be disabled, accompanied by a prompt stating: "Please unassign the article first."

### Rationale for This Distinction

This represents the most critical decision in our data modeling:

- "Assignment" signifies exclusive ownership and retrieval isolation.
- "Association" signifies a reference relationship and content bookmarking.

These two concepts should not be conflated within a single relationship table; doing so would unnecessarily complicate the UI, search functionality, and data import/export processes.

---

## 3. Agent-Exclusive Knowledge for Wiki / Memory / User Categories

For these three categories of articles—Wiki, Memory, and User—agents are permitted to directly create "exclusive knowledge" entries. ### Product Semantics

- This is not a global post.
- This is not a global wiki, memory, or user article.
- This is a private knowledge entry belonging to a specific agent.

### Recommended Creation Method

Within the Agent Content panel:

- Retain the search area for "Link Global Articles"; the UI should directly reuse the interaction pattern found in the `RelatedPanel` of the Post Details page.
- Simultaneously, add a new entry point labeled "Add Exclusive."
- Direct creation is enabled _only_ for `wiki`, `memory`, and `user` article types.
- `linkcase` articles cannot be created directly from the Agent page; they must still be assigned from the dedicated `linkcase` page.

### Database Storage

When creating an exclusive article:

- `for in ('wiki', 'memory', 'user')`
- `scope_type = 'agent'`
- `scope_id = agent.id`
- Do _not_ write an entry to the `agent_article` table.

### Deletion Semantics

- For exclusive `wiki`, `memory`, or `user` articles:
- Removing from the agent = Directly deleting the article.
- For exclusive `linkcase` articles:
- Removing from the agent = Unassigning the article, thereby reverting it to a global article.
- Specifically:
- `scope_type = 'global'`
- `scope_id = null`

These two deletion semantics should be clearly distinguished in the UI as:

- `Delete exclusive article`
- `Unassign from agent`

---

## 4. Agent Content Panel Refinement

It is recommended to split the current unified list into two distinct sources—"Exclusive" and "Linked"—while still retaining the ability to switch between tabs based on `for_type`. ### Current Issue

Currently, the `article_items` in the Content panel are sourced exclusively from `agent_article`. Consequently:

- Agent-specific ("exclusive") articles are not visible.
- It is impossible to distinguish whether a given article is "exclusive" or "related."

### Proposed Interaction

Under each `for_type` tab, two distinct sections should be displayed:

1. `Exclusive`
2. `Related`

Specifically:

- For `wiki / memory / user`:
- `Exclusive`: Articles can be created, edited, and deleted.
- `Related`: Search globally to add associated articles.
- For `linkcase`:
- `Exclusive`: Displays only those Linkcase articles that have already been assigned; assignments can be revoked (unlinked).
- `Related`: Search globally for Linkcase articles to establish associations.

### Reuse Strategy

The search interaction for "associating global articles" should directly reuse the code and API patterns established for the Post Details page:

- Search box
- Search results list
- "Add" button
- "Related" list

It is recommended to introduce a new set of RPCs dedicated specifically to agents; however, their interaction style should remain consistent with the "Post Related" feature, rather than strictly reusing the existing Post data structures.

---

## 5. Query and Retrieval Boundaries

## 5.1 Agent Content List Queries

Introduce an aggregated query—such as `agent.getKnowledge`—that returns:

- `exclusive_articles`
- `related_articles`

Alternatively, it could return a single list where each item includes a metadata field:

- `knowledge_mode: 'exclusive' | 'related'`

Query Rules:

- `exclusive`:
- `article.scope_type='agent'`
- `article.scope_id=agent_id`
- `related`:
- `article.scope_type='global'`
- Join with `agent_article`

### Key Considerations

Article deduplication is required; however, under normal circumstances, a single article should not be permitted to exist simultaneously as both "exclusive" and "related." ---

## 5.2 Agent Search / `content_tool` Retrieval

The retrieval rules within the Agent scope are standardized as follows:

- It is possible to retrieve all articles where `scope_type='global'`.
- It is also possible to retrieve articles where `scope_type='agent' and scope_id=<owner_agent_id>`.
- It is _not_ possible to retrieve private articles belonging to other Agents.

In other words:

- Global + Self-exclusive
- Excludes foreign-exclusive

This rule aligns closely with the logic currently implemented in the `isAllowedScope()` method within `fullTextSearch`; however, it must be extended to cover _all_ search branches, rather than applying only to specific execution paths.

### Search Paths Requiring Unified Auditing

- `fullTextSearch`
- `lookup`
- `rerankArticle`
- Recall -> Evaluate -> Article Retrieval Pipeline
- `agent.searchArticles`
- `content_tool`
- `superego/content_tool`

---

## 5.3 Global Pages and Global Statistics Must Exclude Agent-Private Articles

This represents the pitfall most easily overlooked within the scope of the current proposal.

If data is written directly into the `article` table...

If agent-specific knowledge—where `for='wiki'|'memory'|'user'`—is not properly filtered, private entries will contaminate:

- Post lists
- Post reading views
- Home metrics
- Analytics / Reports
- Global article statistics

### Unified Rules

For any queries targeting "global posts / wikis / memories / users," the following condition must be explicitly added:

- `article.scope_type = 'global'`

Do not rely on `for_type` as a default substitute for defining visibility boundaries.

### Scope of Impact

At a minimum, the following areas require auditing:

- `rpc/post/*`
- `rpc/home/query.ts`
- `report/analytics.ts`
- All logic performing statistics based on `article.for in ('user','wiki','memory')`

---

## 6. Graph Solution

## 6.1 Objectives

Any entities generated by agent-specific articles—including:

- Nodes
- Edges
- Node-chunk associations

must be confined exclusively to that specific agent rather than being deposited into the global graph.

## 6.2 Recommended Principles

- Global articles -> `node.agent_id = null`, `edge.agent_id = null`
- Agent-specific articles -> `node.agent_id = agent.id`, `edge.agent_id = agent.id`

### Resulting Effects

- Agent-private knowledge will form a distinct, private graph.
- The global graph will not be contaminated by the personal knowledge of digital twin agents.
- During the recall phase, the search scope can be narrowed down based on the specific agent.

---

## 6.3 Why the Current Implementation Is Insufficient

Currently:

- Nodes possess an `agent_id`.
- Edges possess an `agent_id`.
- However, the `collectNodes` and `collectRelated` functions used for recall still default to performing a global search.
- Edges currently lack provenance information—specifically, a record indicating "which article provided this specific edge."

While the source of a node can be traced back via `node_chunk -> chunk.article_id`, the same is not currently possible for edges. ---

## 6.4 Recommended Addition: A Provenance Table — `edge_article`

It is recommended to add the following table:

```ts
edge_article(
edge_id text not null references edge(id) on delete cascade,
article_id text not null references article(id) on delete cascade,
created_at timestamp,
primary key (edge_id, article_id)
)
```

### Purpose

1. To identify which specific articles support or substantiate a given edge.
2. To enable "scoped cleanup" operations when an article is unassigned, deleted, or re-extracted.
3. To ensure the reliable persistence of provenance data when rebuilding the knowledge graph after an import.

### Why a `node_article` Table Is Not Strictly Necessary

On the node side, the `node_chunk` table already exists; since each chunk inherently knows its associated `article_id`, this is sufficient to trace back from a node to its source article.

---

## 6.5 Unifying Graph Extraction into a "Scope-Aware" Shared Service

Currently, both the `post` and `linkcase` modules maintain their own separate sets of functions:

- `ensureGlobalNode`
- `ensureGlobalEdge`
- `linkNodesToChunks`

It is recommended to refactor these into a unified service with the following functions:

- `ensureScopedNode({ agent_id })`
- `ensureScopedEdge({ agent_id })`
- `extractArticleGraph({ article_id, content, graph_scope })`

Where the `graph_scope` parameter is defined as:

- `graph_scope = { type: 'global' }`
- `graph_scope = { type: 'agent', agent_id }`

### Usage Scenarios

- Global post / linkcase extraction -> Global Graph
- Agent-exclusive content (Wiki / Memory / User Data) -> Agent-specific Graph
- Linkcase assignment -> Agent-specific Graph Rebuild

---

## 6.6 Refactoring the Recall Mechanism

The `collectNodes` and `collectRelated` functions must be updated to support agent-specific scoping.

### Recommended Rules

Within an agent session:

- Allow matches against global nodes.
- Allow matches against nodes where `agent_id = owner_agent.id`.
- Disallow matches against nodes belonging to other agents.

During graph traversal:

- Global nodes should only traverse via global edges.
- Agent-specific nodes should only traverse via edges belonging to that specific agent.

Ensure that the global graph and agent-specific graphs do not implicitly cross-contaminate or interlink during the recall process. ---

## 6.7 Graph Processing During `linkcase` "Assignment"

This is the most unique of all actions.

When a `linkcase` article—originally global in scope—is assigned to become exclusive to a specific agent, its associated knowledge graph must be switched from "global semantics" to "agent-specific semantics."

### Recommended Handling

Execute `rebuildArticleGraph(article_id, target_agent_id)`:

1. Delete the `node_chunk` entries corresponding to the article's chunks.
2. Delete the `edge_article` entries corresponding to the article.
3. Re-extract the triples.
4. Create new nodes and edges using `agent_id = target_agent_id`.
5. Rebuild the `node_chunk` and `edge_article` entries.

### Historical Data Issues

For older data—specifically articles lacking `edge_article` entries—there is a potential issue where historical "global edges" cannot be precisely reclaimed.

Recommended Strategy:

- Once the new solution is deployed, ensure that all newly extracted data includes the corresponding `edge_article` entries.
- For historical articles:
- Perform a "scoped rebuild" the first time an `assign`, `unassign`, or `import rebuild` operation occurs for that article.
- For any remaining "orphan edges," do not perform a blocking, full-scale retroactive cleanup; instead, leave them to be gradually reclaimed by background cleanup tasks.

This approach is more realistic than attempting to re-process every historical article in a single batch. ---

## 7. API Design Recommendations

## 7.1 Agent Side

It is recommended to add or reorganize the following RPCs:

- `agent.getKnowledge`
- `agent.searchGlobalArticles`
- `agent.createExclusiveArticle`
- `agent.updateExclusiveArticle`
- `agent.deleteExclusiveArticle`
- `agent.unassignExclusiveLinkcaseArticle`
- `agent.exportPack`
- `agent.importPack`

### Behavior Definitions

- `searchGlobalArticles`
- Searches only for `scope_type='global'`
- Used for the "Add Association" function
- `createExclusiveArticle`
- Allows only `wiki | memory | user` types
- Generates `scope_type='agent'`
- `deleteExclusiveArticle`
- Allows deletion only of non-linkcase exclusive articles belonging to the current agent
- `unassignExclusiveLinkcaseArticle`
- Allows only returning an exclusive article with `for='linkcase'` back to the global scope

---

## 7.2 Linkcase Side

It is recommended to add:

- `agent.assignLinkcaseArticle`
- `agent.unassignLinkcaseArticle`
- `agent.relateLinkcaseArticle`
- `agent.unrelateLinkcaseArticle`
- `agent.getLinkcaseArticleAgentState`

### Recommended Return States

For the Linkcase Detail / Header views, the following data should be returned:

- `assigned_agent`
- `related_agents`
- `article_scope_type`
- `article_scope_id`

This ensures that the buttons on the header can immediately determine the current status:

- Unassigned / Available for Association
- Assigned to a specific agent
- Associated with specific agents

---

## 8. UI Design Recommendations

## 8.1 Linkcase Content Header

Add a new icon button to the right side of the content header. Recommendations:

- A single icon button
- Clicking it opens a popover / dropdown menu

Menu Items:

- `Assign to Agent`
- `Unassign`
- `Relate to Agent`
- `Remove Relation`

### State Rules

- Disabled when no article exists
- When an article is already assigned:
- `Assign` changes to "Reassign"
- `Relate` Disabled
- When `article` is `global`:
- `Assign` is available
- `Relate` is available

### Why not use two permanent buttons?

The header already contains Edit, Fetch, and Extract; adding two more buttons would make it too cluttered. A single entry point combined with a semantically clear menu offers a more robust solution.

---

## 8.2 Agent Content Panel

### `wiki / memory / user`

- Keep the search bar at the top: Used for linking global articles.
- Add a `New Exclusive` button.
- Display two groups in the list:
- Exclusive
- Related

### `linkcase`

- `New Exclusive` is not provided.
- Display:
- Exclusive linkcases that have been assigned to this agent.
- Related linkcases that have been linked to this agent.

### Suggested Badges for List Items

- `Exclusive`
- `Related`
- `Global`
- `Assigned from Linkcase`

---

## II. Import/Export Strategy

## 1. Recommended Export Scope

For this iteration, the export mechanism has been changed to generate a "complete snapshot package," rather than merely exporting source data for subsequent reconstruction.

### Mandatory Export Items

- Core Agent Data:
- `agent`
- `agent_vec` (if subsequently confirmed to have been physically written to the database)
- Data Directly Related to the Agent:
- `agent_skill`
- `agent_article`
- `agent_document` (if subsequently confirmed that these should also be migrated along with the agent)
- Full-Chain Data for Agent-Exclusive Articles:
- `article`
