import { session } from '@core/db/schema'
import { addSession, getSession, setSession } from '@core/db/services'
import { connectSession } from '@core/utils'
import { eq } from 'drizzle-orm'

import { buildImRouteKey, buildImSessionTitle } from './route'

import type { SessionInsert } from '@core/db'
import type { ImInboundEvent, ImSessionBinding } from './types'

const connectImSession = async (id: string, title: string) => {
	return connectSession({ id, title })
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

	return {
		route_key,
		session_id: row.id,
		session: target
	}
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

	return {
		route_key,
		session_id: next.id,
		session: target
	}
}
