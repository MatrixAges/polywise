import { agent_session, group_session, im_account, session } from '@core/db/schema'
import { addSession, getImAccount, getSession, setSession } from '@core/db/services'
import {
	addAgentSession,
	addGroupSession,
	getAgentSession,
	getGroupSession,
	removeAgentSession,
	removeGroupSession
} from '@core/db/services/externals'
import { connectSession, GroupStore, SessionStore } from '@core/utils'
import { and, eq } from 'drizzle-orm'

import { buildImRouteKey, buildImSessionTitle, shouldRefreshImSessionTitle } from './route'
import { getImAccountRuntimeConfig, getImAccountSessionTargetConfig } from './runtimeConfig'

import type { SessionInsert } from '@core/db'
import type { ImInboundEvent, ImSessionBinding } from './types'

const connectImSession = async (id: string, title: string) => {
	return connectSession({ id, title })
}

const syncImSessionBindingConfig = async (binding: ImSessionBinding, event: ImInboundEvent) => {
	const account = await getImAccount(
		and(eq(im_account.platform, event.platform), eq(im_account.account_id, event.account_id))!
	)

	if (!account) {
		return
	}

	const session_target = getImAccountSessionTargetConfig(account)
	const current_group_session = await getGroupSession(eq(group_session.session_id, binding.session_id))
	const current_agent_session = await getAgentSession(eq(agent_session.session_id, binding.session_id))
	const next_group_id = session_target.type === 'group' ? session_target.group_id || '' : ''
	const next_agent_id = session_target.type === 'agent' ? session_target.agent_id || '' : ''
	let relation_changed = false

	if (current_group_session && current_group_session.group_id !== next_group_id) {
		await removeGroupSession(eq(group_session.session_id, binding.session_id))
		relation_changed = true
	}

	if (current_agent_session && current_agent_session.agent_id !== next_agent_id) {
		await removeAgentSession(eq(agent_session.session_id, binding.session_id))
		relation_changed = true
	}

	if (next_group_id && (!current_group_session || current_group_session.group_id !== next_group_id)) {
		await addGroupSession(next_group_id, binding.session_id)
		relation_changed = true
	}

	if (next_agent_id && (!current_agent_session || current_agent_session.agent_id !== next_agent_id)) {
		await addAgentSession(next_agent_id, binding.session_id)
		relation_changed = true
	}

	if (relation_changed) {
		SessionStore.delete(binding.session_id)
		GroupStore.delete(binding.session_id)
		binding.session = await connectImSession(binding.session_id, binding.session.session.title)
	}

	const next_config = getImAccountRuntimeConfig(account)
	const current_config = await binding.session.getConfig()

	if (JSON.stringify(current_config) === JSON.stringify(next_config)) {
		return
	}

	await binding.session.setConfig(next_config)
}

export const ensureImSessionBinding = async (event: ImInboundEvent): Promise<ImSessionBinding> => {
	const route_key = buildImRouteKey(event.route)
	const next_title = buildImSessionTitle(event)
	let row = await getSession(eq(session.key, route_key))

	if (!row) {
		try {
			row = await addSession({
				title: next_title,
				key: route_key,
				is_im: true
			} satisfies SessionInsert)
		} catch {
			row = await getSession(eq(session.key, route_key))
		}
	}

	if (!row) {
		throw new Error(`Failed to bind IM route: ${route_key}`)
	}

	if (!row.is_im || row.key !== route_key) {
		row = await setSession(eq(session.id, row.id), {
			is_im: true,
			key: route_key
		})
	}

	if (shouldRefreshImSessionTitle(row.title, event)) {
		row = await setSession(eq(session.id, row.id), {
			title: next_title
		})
	}

	const target = await connectImSession(row.id, row.title)
	const binding = {
		route_key,
		session_id: row.id,
		session: target
	}

	await syncImSessionBindingConfig(binding, event)

	return binding
}

export const resetImSessionBinding = async (event: ImInboundEvent): Promise<ImSessionBinding> => {
	const route_key = buildImRouteKey(event.route)
	const current = await getSession(eq(session.key, route_key))
	const next_title = buildImSessionTitle(event)

	if (current) {
		await setSession(eq(session.id, current.id), { key: null })
	}

	const next = await addSession({
		title: current?.title && !shouldRefreshImSessionTitle(current.title, event) ? current.title : next_title,
		key: route_key,
		is_im: true
	} satisfies SessionInsert)

	const target = await connectImSession(next.id, next.title)
	const binding = {
		route_key,
		session_id: next.id,
		session: target
	}

	await syncImSessionBindingConfig(binding, event)

	return binding
}
