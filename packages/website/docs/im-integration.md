# Polywise IM Integration

## Overview

Polywise can be connected to external messaging platforms through two integration types:

- Discord bot
- Personal WeChat bridge

This document only covers how to integrate with Polywise from the platform side.

## Available Endpoints

Polywise exposes the following IM-related endpoints:

- `GET /im/health`
- `POST /im/wechat/events`
- `POST /im/wechat/status`

Use `GET /im/health` to confirm that the IM service is available.

## Account Setup

Before sending traffic to Polywise, create an `im_account` record for the target platform.

Required fields:

- `platform`
- `account_id`
- `enabled`
- `config_json`

`account_id` is the external account identifier used by Polywise to associate inbound traffic with the correct platform account.

## Discord Integration

### Account Configuration

Create an `im_account` row with:

- `platform = discord`
- `account_id = your account identifier`
- `enabled = true`

Example `config_json`:

```json
{
	"token": "DISCORD_BOT_TOKEN",
	"require_mention": true,
	"allowed_guild_ids": ["123456789012345678"],
	"allowed_channel_ids": ["223456789012345678"],
	"allowed_user_ids": []
}
```

Field descriptions:

- `token`: Discord bot token, required
- `require_mention`: whether guild messages must mention or reply to the bot, defaults to `true`
- `allowed_guild_ids`: guild allowlist, empty means unrestricted
- `allowed_channel_ids`: channel allowlist, empty means unrestricted
- `allowed_user_ids`: user allowlist, empty means unrestricted

### Supported Message Sources

Discord integration supports:

- direct messages
- guild text channels
- threads

When `require_mention` is enabled, guild messages are only processed if the bot is mentioned or the message replies to the bot.

### What Polywise Sends Back

For Discord replies, Polywise may send:

- typing indicators
- normal text replies
- edited streaming replies

No additional Discord webhook setup is required beyond the bot token and the required channel permissions.

## WeChat Bridge Integration

### Integration Model

WeChat is integrated through a bridge service.

The bridge is responsible for:

- receiving WeChat events
- forwarding inbound messages to Polywise
- accepting outbound send and typing requests from Polywise

### Account Configuration

Create an `im_account` row with:

- `platform = wechat`
- `account_id = your account identifier`
- `enabled = true`

Example `config_json`:

```json
{
	"bridge_base_url": "https://your-wechat-bridge.example.com",
	"secret": "shared-secret",
	"send_path": "/send",
	"typing_path": "/typing"
}
```

Field descriptions:

- `bridge_base_url`: bridge base URL, required
- `secret`: shared secret between Polywise and the bridge, required
- `send_path`: message send path, defaults to `/send`
- `typing_path`: typing path, defaults to `/typing`

### Bridge to Polywise

The bridge sends callbacks to:

- `POST /im/wechat/events`
- `POST /im/wechat/status`

Headers:

```txt
x-polywise-signature: <hex(hmac_sha256(secret, raw_body))>
content-type: application/json
```

Minimum payload for `/im/wechat/events`:

```json
{
	"account_id": "wx-main",
	"peer_id": "wxid_xxx",
	"peer_name": "Alice",
	"sender_id": "wxid_xxx",
	"sender_name": "Alice",
	"message_id": "msg_123",
	"text": "Hello",
	"context_token": "optional-token",
	"received_at": 1747730000000
}
```

Required fields:

- `account_id`: must match `im_account.account_id`
- `peer_id` or `sender_id`: peer identifier
- `text`: inbound text message

### Polywise to Bridge

Polywise sends outbound requests to:

- `POST <bridge_base_url>/send`
- `POST <bridge_base_url>/typing`

Both paths can be overridden through `send_path` and `typing_path`.

Headers:

```txt
x-polywise-signature: <hex(hmac_sha256(secret, raw_body))>
content-type: application/json
```

Send message payload:

```json
{
	"account_id": "wx-main",
	"peer_id": "wxid_xxx",
	"text": "Hello, this is Polywise."
}
```

Typing payload:

```json
{
	"account_id": "wx-main",
	"peer_id": "wxid_xxx"
}
```

Recommended `/send` response:

```json
{
	"message_id": "bridge_msg_123"
}
```

## Control Commands

Polywise recognizes the following message commands from IM channels:

- `/stop`
- `/reset`
- `/new`

Behavior:

- `/stop`: stops the current in-progress reply
- `/reset`: starts a new conversation context for that route
- `/new`: same as `/reset`

## Validation Checklist

Recommended validation order:

1. Create the platform `im_account` record.
2. Start Polywise and verify `GET /im/health`.
3. For Discord, send a DM to the bot and confirm a reply.
4. For Discord guild channels, verify mention or reply behavior if `require_mention` is enabled.
5. For WeChat, send a signed event to `POST /im/wechat/events`.
6. Confirm that Polywise calls the bridge `/typing` and `/send` endpoints.
7. Verify `/stop` and `/reset`.

## Current Limitations

- WeChat currently supports direct-message style integration only
- attachment handling is not implemented yet
- `POST /im/wechat/status` is reserved for status callbacks
- Discord voice is not supported
