# Polywise IM Runtime Plan

Last Updated: 2026-05-20

## Goals

Implement a long-term maintainable IM runtime under `packages/polywise/src/im/` that integrates the following platforms through a unified session, scheduling, and response model:

- Discord
- WeChat (personal WeChat bridge)

This plan should be implemented directly in its target-state form, without a `v1/v2` layered design. Platform capabilities may differ, but the runtime boundary, scheduling model, session binding model, and response protocol should all be finalized in one pass.

## Design Principles

### 1. Decouple Sessions from Platforms

Reuse the existing `Session / Group / getStream()` as the AI execution core. The IM runtime is only responsible for:

- platform connectivity
- inbound event normalization
- route key resolution
- binding route keys to sessions
- serial scheduling per route
- outbound delivery and streaming updates

The model must not participate in deciding which platform or channel a message should be sent to.

### 2. Deterministic Routing

Following the OpenClaw approach, each platform adapter should only produce a normalized route:

- platform
- account_id
- chat_type
- peer/channel/thread identity

The route is then converted into a `session.key` through a unified rule set, and that key is bound to the existing `session` table.

### 3. Serial Execution Per Route

Following the Hermes approach, any IM route may have at most one active agent turn at any given time.

- New messages arriving on the same route enter a FIFO queue.
- By default, the current execution is not interrupted.
- Only explicit control commands may trigger interruption or stop behavior.

### 4. Platform Capability Matrix

Platform capabilities differ, but the runtime interface remains unified.

| Capability      | Discord            | WeChat                                          |
| --------------- | ------------------ | ----------------------------------------------- |
| Inbound text    | Supported          | Supported                                       |
| Outbound text   | Supported          | Supported                                       |
| Typing          | Supported          | Supported                                       |
| Streaming edits | Supported          | Not supported, downgrade to typing + final send |
| Threads/topics  | Supports threads   | Not supported                                   |
| Attachments     | Reserved interface | Reserved interface                              |

WeChat not supporting streaming edits does not mean the runtime is downgraded. The main flow still uses the unified streaming pipeline, with the adapter capability simply declaring `message_edit=false`.

## Integration Points with the Existing System

### Existing Reusable Capabilities

- `session.key` already exists and can directly store the route key
- `session.is_im` already exists and can isolate IM sessions from the regular session list
- `connectSession()` and `session.getStream()` are already reusable
- `abortStream()` can already serve as the stop capability for IM control commands
- The Hono service already exists and can directly host IM webhook / sidecar callback routes

### Capabilities That Must Be Added

- route key -> session resolution and creation
- global IM runtime registration on `env`
- per-route queue and worker
- platform adapter lifecycle
- stream consumption and platform response handling outside the frontend SSE mode
- native Discord gateway connectivity and REST outbound delivery
- WeChat bridge protocol and callback entrypoint

## Directory Structure

Planned additions:

```text
packages/polywise/src/im/
  index.ts
  initImRuntime.ts
  runtime.ts
  types.ts
  route.ts
  session.ts
  stream.ts
  message.ts
  config.ts
  utils.ts
  adapters/
    base.ts
    discord.ts
    wechat.ts
```

## Core Data Model

### 1. Normalized Inbound Event

```ts
interface ImInboundEvent {
  platform: 'discord' | 'wechat'
  account_id: string
  route: {
    chat_type: 'dm' | 'channel' | 'thread'
    chat_id: string
    parent_chat_id?: string
    guild_id?: string
    thread_id?: string
    title?: string
  }
  sender: {
    id: string
    name?: string
    is_self?: boolean
  }
  message: {
    id: string
    text: string
    reply_to_id?: string
    attachments?: Array<...>
    raw?: unknown
  }
  received_at: number
}
```

### 2. Route Key

The route key is stored directly in `session.key`:

- Discord DM: `im:discord:<accountId>:dm:<channelId>`
- Discord Channel: `im:discord:<accountId>:guild:<guildId>:channel:<channelId>`
- Discord Thread: `im:discord:<accountId>:guild:<guildId>:channel:<parentId>:thread:<threadId>`
- WeChat DM: `im:wechat:<accountId>:dm:<peerId>`

Constraints:

- The same route key must always bind to the same session unless there is an explicit reset/rebind.
- A thread must not be merged into its parent channel session.
- WeChat only allows DM routes.
- Reset semantics must create a newly bound session for the route, rather than deleting message history in place on the existing session.

### 3. Session Metadata

No new route field is added to the `session` table. Reuse the existing fields:

- `key`: route key
- `is_im`: `true`

Also add the following IM-specific tables:

#### `im_account`

Stores account configuration and runtime state.

Fields:

- `id`
- `platform`
- `account_id`
- `label`
- `enabled`
- `config_json`
- `status`
- `last_error`
- `created_at`
- `updated_at`

#### `im_peer_state`

Stores platform-side conversation state.

Fields:

- `id`
- `platform`
- `account_id`
- `peer_key`
- `state_json`
- `created_at`
- `updated_at`

Use cases:

- Discord draft message id / channel cache
- WeChat context token
- WeChat sidecar peer metadata

## Reset / Rebind Semantics

Explicit IM session reset commands such as `/reset` or `/new` must:

- abort the currently running stream for that route
- detach the route key from the old session
- create a fresh IM session row with the same route key
- reconnect subsequent turns to the new session

This preserves historical message auditability and avoids mutating an old session into a logically new conversation.

## Bridge Authentication

The WeChat bridge should use the same HMAC-based signature contract in both directions:

- callbacks from bridge to Polywise send `x-polywise-signature`
- outbound requests from Polywise to bridge also send `x-polywise-signature`

The signature is `hex(hmac_sha256(secret, raw_body))`.

## Scheduling Model

### 1. Global Runtime

Mount the following on `env.im`:

- adapters
- route queue registry
- worker registry
- runtime status

### 2. Route-Level Worker

Each `route_key` has one state object. In the current implementation this queue state lives inside `runtime.ts`:

- `pending`
- `running`
- `last_active_at`

Rules:

- New events are enqueued.
- If the worker is idle, draining starts immediately.
- A single worker consumes events sequentially.
- After one turn completes, the worker continues with the remaining queued events.

### 3. Interruption Semantics

Control messages are identified by the adapter or a command parser:

- `/stop`
- `/reset`

Behavior:

- `/stop` calls `session.abortStream()`
- `/reset` first calls `abortStream()`, then creates a newly bound session for the route

Regular messages must not interrupt the current turn by default.

## Polywise Message Mapping

All IM inbound messages are converted into the current FST message format:

- `role = 'user'`
- `parts = [{ type: 'text', text }]`
- Write the following into `metadata`:
     - `timestamp`
     - `sender`
     - `sender_id`
     - `group_name`
     - `group_id`

For shared channel/thread sessions, rely on the existing metadata so the model can see who is speaking.

## Stream Consumption and Platform Response Handling

### 1. Unified Stream Bridge

After calling `session.getStream(message)`, do not use frontend SSE. Instead, let the IM runtime directly consume the returned UI message stream.

During consumption:

- accumulate assistant text
- detect text deltas
- choose behavior based on adapter capability:
     - `sendTyping`
     - `createDraftMessage`
     - `updateDraftMessage`
     - `finalizeDraftMessage`

### 2. Discord Response Strategy

Discord target-state behavior:

- Send a placeholder draft message when generation starts
- PATCH the message when text deltas arrive, using a throttling window
- Finalize when generation ends
- Send a default prompt if the reply is empty

### 3. WeChat Response Strategy

WeChat target-state behavior:

- Send typing when generation starts
- Send the final text in platform-limited chunks after generation finishes
- Do not attempt message edits

## Platform Implementation

### Discord

Implementation approach:

- native gateway websocket
- native REST API
- no large framework; directly use the existing `ws` + `fetch`

Capabilities:

- connect to `/gateway/bot`
- heartbeat / reconnect / resume
- listen to `MESSAGE_CREATE`
- filter self messages
- normalize guild/channel/thread routes
- typing: `POST /channels/{id}/typing`
- send: `POST /channels/{id}/messages`
- edit: `PATCH /channels/{id}/messages/{id}`

Default strategy:

- Always respond in DMs
- In guild/channel/thread contexts, only respond when `@bot` is mentioned or the message replies to the bot
- Continue responding inside a thread once the bot has already participated

### WeChat

Do not couple a WeChat SDK directly into the main repository. Use a bridge sidecar instead:

- The Polywise main process is responsible for runtime, session, queue, callbacks, and outbound protocol
- The sidecar is responsible for QR login, long-polling/SDK integration, media handling, and context tokens

Protocol between the main process and the sidecar:

- Sidecar -> Polywise
     - `POST /sys/im/wechat/events`
     - `POST /sys/im/wechat/status`
- Polywise -> Sidecar
     - `POST {bridge_base_url}/send`
     - `POST {bridge_base_url}/typing`

Authentication:

- HMAC secret header

Sidecar liveness is driven by `im_account.config_json.bridge_base_url`.

## HTTP / API Endpoints

Add the following Hono routes:

- `POST /sys/im/wechat/events`
- `POST /sys/im/wechat/status`
- `GET /sys/im/health`

Reserve later management APIs as RPC:

- `im.listAccounts`
- `im.upsertAccount`
- `im.removeAccount`
- `im.getRuntimeStatus`

In this round, at minimum implement the database service and runtime read/write capabilities. Do not hard-block on UI completion.

## Startup Flow

Append the following in `initEnv()`:

1. initialize DB
2. initialize cron
3. initialize IM runtime
4. start enabled adapters

At startup:

- Read enabled accounts from `im_account`
- Create adapters
- Call adapter `connect()`
- Write status back to `im_account.status`

## Execution Steps

1. Add DB schema and migration
2. Implement IM types / route / session binding
3. Implement runtime and route queue
4. Implement the stream bridge
5. Wire `env` and Hono API
6. Implement the Discord adapter
7. Implement the WeChat bridge adapter
8. Run a local build verification

## Acceptable Adjustments

The following items may be fine-tuned during implementation without changing the overall boundary:

- the field structure of `im_peer_state.state_json`
- Discord mention/reply decision details
- the stream edit throttling window
- WeChat sidecar payload field naming

The following items must not be rolled back:

- Do not push platform-coupled logic into `Session`
- Do not replace route key binding with "one global IM session"
- Do not omit the per-route serial queue
- Do not let the model decide the outbound target by itself
