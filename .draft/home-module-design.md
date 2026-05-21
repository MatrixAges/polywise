# Home Module Design

## Goal

`home` should become the operational dashboard for the whole agentic content system, not a marketing landing page.

It should answer three questions fast:

1. What is happening right now?
2. What assets and behaviors are accumulating over time?
3. What should the system proactively tell the user next?

This draft covers:

- homepage analytics surface
- backend RPC design direction
- `pthink` design, scheduling, triggers, and config

Frontend page implementation is intentionally excluded from this draft and handled in code.

---

## 0. Current implementation status

As of the current code state:

- homepage usage analytics already read directly from `message.metadata.usage`
- no telemetry table is added
- `pthink` runtime now exists under `packages/polywise/src/pthink/`
- `pthink` outputs are currently persisted as:
     - `article.for = 'memory'` posts with `metadata.pthink`
     - notification entries linked to a dedicated post session
     - runtime state in `~/.polywise/pthink.json`

This means the selected implementation path is now:

- no new `pthink_report` / `pthink_signal` / `pthink_job_run` tables for phase 1
- use existing content and notification surfaces first
- keep future normalization as an optimization option, not a default requirement

---

## 1. Analytics Brainstorm

### 1.1 Metrics directly supported by current schema

These can be computed now from existing tables.

#### Session layer

- total sessions
- sessions created today / this week / this month
- running sessions
- unread sessions
- IM sessions
- cron sessions
- average messages per session
- session recency distribution
- most recently active sessions
- sessions without follow-up after last update

Source tables:

- `session`
- `message`
- external bindings: `project_session`, `group_session`, `agent_session`, `post_session`, `todo_session`

#### Content layer

- total documents
- total articles
- total posts (`article.for in ['user', 'wiki', 'memory']`)
- post split by `user/wiki/memory`
- total chunks
- average chunks per article
- long article count
- pipeline pending documents
- pipeline pending articles
- pipeline pending posts
- recent updated posts
- recent updated documents/articles
- link total / link ready / link pending / link fail

Source tables:

- `document`
- `article`
- `chunk`
- `link`
- `link_article`
- `post_article`
- `post_project`
- `post_session`

#### Agent / org layer

- total agents
- total groups
- total skills
- total projects
- average sessions per agent
- average content attached per agent
- agents with no recent session
- agents with high tool usage potential

Source tables:

- `agent`
- `group`
- `skill`
- `project`
- `agent_session`
- `session_agent`
- `agent_article`
- `agent_document`
- `agent_skill`
- `group_agent`

#### Todo / execution layer

- total todos
- open todos
- done / backlog / processing / error / archive split
- overdue todos
- todos without linked session
- project todo distribution
- sessions created from todos
- todo completion lag using `created_at -> updated_at`

Source tables:

- `todo`
- `project_todo`
- `session_todo`
- `todo_session`
- `agent_todo`
- `todo_tag`

#### Memory graph / rewire layer

- total nodes
- total edges
- frozen node / edge counts
- nodes created recently
- rewire events this day / week
- per-agent graph size
- active vs silent edge ratio
- unstable edge ratio (`state`, `stability`, `rewire_score`)
- recent rewire touched surface

Source tables:

- `node`
- `edge`
- `rewire_event`
- `node_chunk`

#### Notification / IM layer

- unread notifications
- pushed vs not pushed notifications
- enabled IM accounts
- IM peer count
- account status distribution

Source tables:

- `notification`
- `notification_session`
- `im_account`
- `im_peer_state`

---

### 1.2 Metrics that should use message metadata first

These should not introduce a new telemetry table for now.

Primary source:

- `message.content -> metadata.usage`
- `message.content -> metadata.sender_id`
- session bindings to agent/project

#### AI usage metrics

- input tokens
- output tokens
- total tokens
- reasoning tokens
- cached tokens
- per-provider usage
- per-model usage
- usage by feature area
     - session chat
     - post session
     - cron
     - linkcase extraction
     - group sessions
- average tokens per session / per post / per report

Implementation note:

- token totals can be aggregated exactly from assistant messages
- provider/model attribution should use this priority:
     1. `metadata.sender_id -> agent.model`
     2. `agent_session -> agent.model`
     3. `project_session -> project.model`
     4. `config.default_model`

#### Model call metrics

- call count by provider
- call count by model id
- latency by model
- abort rate by model
- tool-call-heavy vs direct-answer ratio
- context length growth trend

#### Tool / skill operation metrics

- tool call count by tool
- tool success rate
- tool error rate
- skill usage count
- skill error rate
- average tool chain length per task

Note:

Some tool logs already exist as JSONL under agent logs, but they are not normalized into queryable analytics tables.

#### Behavior / habit metrics

- content creation streak
- days with no captured learning
- post completion rate
- research-to-output conversion ratio
- memory growth rate
- agent switching frequency
- project focus concentration
- unresolved alert streak

---

## 2. Recommended homepage metric tiers

Not all brainstormed metrics belong on the first screen.

### Tier A: default homepage

- running sessions
- unread sessions
- sessions created this week
- total messages
- total posts and post split
- pending pipeline counts
- total docs/articles/chunks
- link ready vs pending
- open todos
- unread notifications
- enabled IM accounts
- graph nodes/edges
- rewire events this week
- recent sessions / posts / notifications
- `pthink` status

### Tier B: expandable homepage panels

- per-project activity
- per-agent activity
- todo status distribution
- content health warnings
- graph stability warnings
- recent system anomalies

### Tier C: secondary analytics page or drilldown

- token and model analytics
- provider cost analytics
- report quality history
- trigger hit-rate history
- per-agent tool and skill performance

---

## 3. Backend RPC proposal

### 3.1 Immediate RPC

Implement first:

- `rpc.home.query`

Suggested shape:

```ts
{
  overview: {
    session_total: number
    sessions_running: number
    sessions_unread: number
    sessions_im: number
    sessions_cron: number
    sessions_week: number
    message_total: number
    messages_week: number
    avg_messages_per_session: number
  }
  content: {
    document_total: number
    article_total: number
    chunk_total: number
    link_total: number
    link_ready_total: number
    link_pending_total: number
    documents_pending: number
    articles_pending: number
    posts_pending: number
    post_for_counts: { user: number; wiki: number; memory: number }
    long_article_total: number
    avg_chunks_per_article: number
  }
  system: {
    agent_total: number
    group_total: number
    project_total: number
    skill_total: number
    todo_total: number
    open_todo_total: number
    todo_status_counts: Record<string, number>
    notification_total: number
    notification_unread: number
    im_account_total: number
    im_account_enabled: number
    im_peer_total: number
  }
  memory: {
    node_total: number
    frozen_node_total: number
    edge_total: number
    frozen_edge_total: number
    rewire_event_total: number
    rewire_event_week: number
  }
  recent: {
    sessions: Array<...>
    posts: Array<...>
    notifications: Array<...>
  }
  coverage: {
    has_usage_telemetry: boolean
    note: string
  }
}
```

This is enough to power the first production homepage.

---

### 3.2 Next-step RPC after homepage v1

- `rpc.home.query` already carries:
     - usage snapshot
     - recent `pthink` reports
     - persisted `pthink` runtime status
- optional future split RPCs:
     - `rpc.home.timeline.query`
     - `rpc.home.alerts.query`
     - `rpc.home.drilldown.query`

Suggested future responsibilities:

- `timeline`: daily aggregates for charts
- `alerts`: surfaced anomalies and recommendations
- `drilldown`: heavier model/provider/project analytics not needed on first paint

---

## 4. Storage recommendations

Current decision:

- do not add a telemetry table yet
- use `message.metadata.usage` as the source of truth for homepage AI usage analytics

Future normalization is only needed if:

- analytics queries become too slow
- cost accounting becomes a hard requirement
- exact per-call auditing is needed

### 4.1 Selected storage path now

- report body: `article` row with `for = 'memory'`
- report metadata: `article.metadata.pthink`
- continuation surface: linked post session
- proactive surfacing: `notification` + `notification_session`
- runtime state and dedupe memory: `~/.polywise/pthink.json`

Why this path was chosen:

- zero migration cost
- homepage and post list can immediately surface reports
- notification center can immediately surface autonomous insights
- runtime dedupe does not need relational storage yet

### 4.2 Optional future normalization only if needed

Consider dedicated tables later only if one of these becomes true:

- report history needs richer filtering than post metadata can provide
- signal hit-rate analysis becomes a product feature
- job auditing and retry analytics become important
- file-backed runtime state becomes too opaque for ops/debugging

---

## 5. PThink design

## 5.1 What `pthink` is

`pthink` is the agentic self-observation layer.

It should:

- collect signals automatically
- analyze behavior without being asked
- generate periodic reports
- generate opportunistic trigger reports
- surface recommendations and warnings

It should not wait for the user to ask, "how am I doing?"

---

## 5.2 Core principles

### proactive, not reactive

`pthink` runs because the system noticed something worth reflecting on.

### idle-first

Heavy analysis should prefer idle windows and avoid competing with foreground work.

### bounded

It must have report caps, dedupe logic, and skip conditions, otherwise it becomes noisy.

### multi-timescale

- immediate trigger insight
- daily summary
- weekly pattern synthesis

### report, don’t ramble

Outputs should be concise, useful, and action-oriented.

---

## 5.3 Runtime model

Implemented folder:

- `packages/polywise/src/pthink/`

Current modules:

- `index.ts`
- `runtime.ts`
- `constants.ts`
- `analytics.ts`
- `synthesize.ts`
- `status.ts`
- `types.ts`

Current responsibility split:

- `runtime.ts`: in-memory state, boot, stop, trigger dispatch
- `constants.ts`: config normalization and cron weekday mapping
- `analytics.ts`: DB aggregates and trigger candidate detection
- `synthesize.ts`: fallback report builder plus LLM-assisted synthesis
- `status.ts`: read/write `~/.polywise/pthink.json`

---

## 5.4 Scheduling model

Use existing `Croner` infrastructure, but treat `pthink` as a system-owned job family rather than user-authored cron content.

Implemented system jobs:

- `pthink.daily`
- `pthink.weekly`
- monitor loop for idle + trigger scan

### daily

- default enabled
- default 21:00 local time
- window: last 24 hours

### weekly

- default enabled
- default Sunday 20:00 local time
- window: last 7 days

### trigger scan

- frequent lightweight scan
- implemented as a background monitor loop
- only generates a report when trigger conditions pass and caps allow it

### idle gate

Before heavy generation:

- app not active
- no session currently running
- idle grace satisfied
- optional cool-down since last `pthink` run

This should mirror the current `rewire` runtime gating style.

---

## 5.5 Trigger mechanism

Trigger reports are where `pthink` becomes genuinely agentic.

Current implemented trigger families:

### ai usage spike

- high assistant reply count in 6h
- high token concentration in 6h

### session burst

- many new sessions or messages in 6h

### knowledge growth

- multiple new posts in 24h
- heavy `rewire_event` activity in 24h

### backlog pressure

- pending pipeline accumulation
- unread notification accumulation
- open todo pressure

Still good future additions:

- focus fragmentation
- post completion stall
- linkcase-heavy / synthesis-light behavior
- project switching drift

Each trigger should produce:

- `signal key`
- `severity`
- `evidence payload`
- `recommended report template`

---

## 5.6 Report types

### Daily report

Purpose:

- tell the user what changed today
- summarize activity rhythm
- point out one or two meaningful next steps

Sections:

- what happened
- what accumulated
- what is at risk
- suggested next move

### Weekly report

Purpose:

- detect patterns, not events
- compare input vs output
- compare collection vs synthesis
- compare workload vs closure

Sections:

- weekly operating pattern
- knowledge growth
- execution health
- standout trends
- next-week recommendation

### Trigger report

Purpose:

- short and urgent
- based on a concrete signal

Sections:

- what was detected
- why it matters
- evidence
- suggested corrective action

---

## 5.7 Where reports surface

Current surfacing order:

1. homepage `PThink Status` panel
2. notification center
3. post list as memory reports
4. linked post session for follow-up conversation

---

## 5.8 Configuration in General Setting

Current recommended config surface:

- master enable switch
- idle grace minutes
- daily report enable + hour
- weekly report enable + weekday + hour
- trigger insights enable
- max reports per day

Advanced options can come later:

- trigger sensitivity
- quiet hours
- notification style
- report verbosity
- auto-save reports as posts

---

## 5.9 Suggested implementation phases

### Phase 1

Status: completed

- homepage snapshot RPC
- homepage UI
- config shape for `pthink`
- general setting controls
- message-metadata usage analytics

### Phase 2

Status: completed

- `packages/polywise/src/pthink` runtime scaffold
- system cron registration
- daily and weekly job runners
- simple report persistence via `article + notification + pthink.json`

### Phase 3

Status: partially completed

- trigger scan
- notification integration
- homepage `pthink` report history

Not yet done:

- relational signal persistence
- dedicated reports/drilldown page

### Phase 4

Status: deferred

- richer usage analytics on top of message metadata
- report quality scoring
- timeline charts

---

## 6. Review focus

The remaining review points are now narrower:

1. Are the current trigger families sufficient, or should we add more behavior-oriented triggers before exposing this broadly?
2. Should weekly reports bias more toward productivity, content output, or knowledge graph evolution?
3. Do you want a dedicated reports list/drilldown page next, or keep reports discoverable through Home + Post + Notification for now?
