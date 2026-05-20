# Polywise IM Integration

## Overview

Polywise can be connected to external messaging platforms through two integration types:

- Discord bot
- Feishu self-built app bot
- WeChat ClawBot / iLink direct channel

This document only covers how to integrate with Polywise from the platform side.

## Available Endpoints

Polywise exposes the following IM-related endpoints:

- `GET /im/health`
- `POST /im/feishu/events`
- `POST /im/wechat/events`
- `POST /im/wechat/status`

These routes are mounted under `/sys`, so the actual callback URLs are:

- `GET /sys/im/health`
- `POST /sys/im/feishu/events`
- `POST /sys/im/wechat/events`
- `POST /sys/im/wechat/status`

Use `GET /sys/im/health` to confirm that the IM service is available.
The WeChat HTTP callback endpoints are kept for legacy bridge compatibility, but the default WeChat integration is now direct ClawBot / iLink polling.

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

## Feishu Integration

### Integration Model

Feishu is integrated as a self-built app bot with event subscription callbacks.

Polywise:

- receives inbound messages through Feishu event subscriptions
- verifies the subscription challenge
- exchanges `app_id` and `app_secret` for a tenant access token
- sends outbound replies through the Feishu message API

### Account Configuration

Create an `im_account` row with:

- `platform = feishu`
- `account_id = your account identifier`
- `enabled = true`

Example `config_json`:

```json
{
	"app_id": "cli_xxxxxxxxxxxxx",
	"app_secret": "xxxxxxxxxxxxxxxx",
	"verification_token": "xxxxxxxxxxxxxxxx",
	"encrypt_key": "xxxxxxxxxxxxxxxx",
	"session_target": {
		"type": "global"
	}
}
```

Field descriptions:

- `app_id`: Feishu self-built app App ID, required
- `app_secret`: Feishu self-built app App Secret, required
- `verification_token`: event subscription verification token, required
- `encrypt_key`: event subscription encrypt key, optional unless encryption is enabled

### Feishu App Setup

In Feishu Open Platform:

1. Create a self-built app.
2. Enable the bot capability.
3. Add an event subscription request URL pointing to `POST /sys/im/feishu/events`.
4. Subscribe to message receive events for the bot.
5. Copy the app's `App ID`, `App Secret`, `Verification Token`, and optional `Encrypt Key` into the Polywise IM settings page.

Polywise currently normalizes text messages from Feishu. Rich text, file attachments, and message cards are not handled yet.

## WeChat ClawBot Integration

### Integration Model

WeChat is integrated directly through the ClawBot / iLink bot channel.

Polywise:

- polls inbound messages from the iLink API using `getupdates`
- sends outbound replies using `sendmessage`
- keeps typing state alive using `getconfig` + `sendtyping`

### Account Configuration

Create an `im_account` row with:

- `platform = wechat`
- `account_id = your account identifier`
- `enabled = true`

Example `config_json`:

```json
{
	"bot_token": "ILINK_BOT_TOKEN",
	"api_base_url": "https://ilinkai.weixin.qq.com/ilink/bot/"
}
```

Field descriptions:

- `bot_token`: WeChat ClawBot / iLink bot token, required
- `api_base_url`: iLink API base URL, optional

### Inbound Polling

Polywise polls:

- `POST <api_base_url>/getupdates`

The adapter stores the latest `get_updates_buf` cursor and the peer `context_token`, then normalizes text items into the internal IM event format.

### Outbound Replies

Polywise sends outbound requests to:

- `POST <api_base_url>/sendmessage`
- `POST <api_base_url>/getconfig`
- `POST <api_base_url>/sendtyping`

The `context_token` received from the latest inbound message is reused when sending replies.

### Legacy Bridge Compatibility

Legacy bridge-mode accounts are still supported if `config_json` contains:

- `bridge_base_url`
- `secret`
- optional `send_path`
- optional `typing_path`

Legacy mode uses the webhook endpoints:

- `POST /im/wechat/events`
- `POST /im/wechat/status`

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
5. For WeChat, configure a valid ClawBot token and confirm that `getupdates` returns inbound messages.
6. For Feishu, confirm the event subscription challenge succeeds and text messages sent to the bot receive a reply.
7. Confirm that Polywise sends `sendtyping` and `sendmessage` successfully where supported.
8. Verify `/stop` and `/reset`.

## Current Limitations

- WeChat currently supports direct-message style integration only
- Feishu currently supports text messages only
- attachment handling is not implemented yet
- legacy `POST /im/wechat/status` is reserved for bridge-mode status callbacks
- Discord voice is not supported
