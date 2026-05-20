import type { ImInboundEvent, ImRoute } from './types'

export const getAdapterKey = (platform: string, account_id: string) => `${platform}:${account_id}`

export const buildImRouteKey = (route: ImRoute) => {
	if (route.platform === 'discord') {
		if (route.chat_type === 'dm') {
			return `im:discord:${route.account_id}:dm:${route.chat_id}`
		}

		if (route.chat_type === 'thread') {
			return `im:discord:${route.account_id}:guild:${route.guild_id || 'unknown'}:channel:${route.parent_chat_id || route.chat_id}:thread:${route.thread_id || route.chat_id}`
		}

		return `im:discord:${route.account_id}:guild:${route.guild_id || 'unknown'}:channel:${route.chat_id}`
	}

	return `im:wechat:${route.account_id}:dm:${route.chat_id}`
}

export const buildImPeerKey = (route: ImRoute) => {
	if (route.platform === 'discord') {
		if (route.chat_type === 'thread') {
			return `discord:${route.account_id}:thread:${route.thread_id || route.chat_id}`
		}

		return `discord:${route.account_id}:${route.chat_type}:${route.chat_id}`
	}

	return `wechat:${route.account_id}:dm:${route.chat_id}`
}

export const buildImSessionTitle = (event: ImInboundEvent) => {
	const sender = event.sender.name || event.sender.id

	if (event.platform === 'discord') {
		if (event.route.chat_type === 'dm') {
			return `Discord DM ${sender}`
		}

		if (event.route.chat_type === 'thread') {
			return event.route.title || `Discord Thread ${event.route.thread_id || event.route.chat_id}`
		}

		return event.route.title || `Discord Channel ${event.route.chat_id}`
	}

	return `WeChat DM ${sender}`
}
