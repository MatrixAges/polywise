import type { ImInboundEvent, ImRoute } from './types'

export const getAdapterKey = (platform: string, account_id: string) => `${platform}:${account_id}`

const getDiscordGuildLabel = (route: ImRoute) => {
	return route.guild_name?.trim() || route.guild_id?.trim() || 'Discord'
}

const getDiscordChannelLabel = (route: ImRoute) => {
	return route.title?.trim() || route.chat_id
}

const getDiscordParentLabel = (route: ImRoute) => {
	return route.parent_title?.trim() || route.parent_chat_id?.trim() || 'unknown'
}

const buildDiscordHierarchicalTitle = (route: ImRoute) => {
	if (route.chat_type === 'thread') {
		return [getDiscordGuildLabel(route), getDiscordParentLabel(route), getDiscordChannelLabel(route)].join(': ')
	}

	return [getDiscordGuildLabel(route), getDiscordChannelLabel(route)].join(': ')
}

const getLegacyDiscordSessionTitles = (route: ImRoute) => {
	if (route.chat_type === 'dm') {
		return [] as Array<string>
	}

	const titles = [] as Array<string>

	if (route.title?.trim()) {
		titles.push(route.title.trim())
	}

	if (route.chat_type === 'thread') {
		titles.push(`Discord Thread ${route.thread_id || route.chat_id}`)
	} else {
		titles.push(`Discord Channel ${route.chat_id}`)
	}

	titles.push(
		`${getDiscordGuildLabel(route)} · ${route.chat_type === 'thread' ? route.thread_id || route.chat_id : route.chat_id}`
	)

	return titles
}

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

		return buildDiscordHierarchicalTitle(event.route)
	}

	return `WeChat DM ${sender}`
}

export const shouldRefreshImSessionTitle = (current_title: string, event: ImInboundEvent) => {
	if (event.platform !== 'discord') {
		return false
	}

	const next_title = buildImSessionTitle(event)

	if (current_title === next_title) {
		return false
	}

	return getLegacyDiscordSessionTitles(event.route).includes(current_title)
}
