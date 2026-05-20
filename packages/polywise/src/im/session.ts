import { im_account, session } from '@core/db/schema'
import { addSession, getImAccount, getSession, setSession } from '@core/db/services'
import { connectSession } from '@core/utils'
import { and, eq } from 'drizzle-orm'

import { buildImRouteKey, buildImSessionTitle } from './route'
import { getImAccountRuntimeConfig } from './runtimeConfig'

import type { SessionInsert } from '@core/db'
import type { ImInboundEvent, ImSessionBinding } from './types'

const connectImSession = async (id: string, title: string) => {
	return connectSession({ id, title })
}

const syncImSessionRuntimeConfig = async (binding: ImSessionBinding, event: ImInboundEvent) => {
	const account = await getImAccount(
		and(eq(im_account.platform, event.platform), eq(im_account.account_id, event.account_id))!
	)

	if (!account) {
		return
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
	let row = await getSession(eq(session.key, route_key))

	if (!row) {
		try {
			row = await addSession({
				title: buildImSessionTitle(event),
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

	const target = await connectImSession(row.id, row.title)
	const binding = {
		route_key,
		session_id: row.id,
		session: target
	}

	await syncImSessionRuntimeConfig(binding, event)

	return binding
}

export const resetImSessionBinding = async (event: ImInboundEvent): Promise<ImSessionBinding> => {
	const route_key = buildImRouteKey(event.route)
	const current = await getSession(eq(session.key, route_key))

	if (current) {
		await setSession(eq(session.id, current.id), { key: null })
	}

	const next = await addSession({
		title: current?.title || buildImSessionTitle(event),
		key: route_key,
		is_im: true
	} satisfies SessionInsert)

	const target = await connectImSession(next.id, next.title)
	const binding = {
		route_key,
		session_id: next.id,
		session: target
	}

	await syncImSessionRuntimeConfig(binding, event)

	return binding
}
