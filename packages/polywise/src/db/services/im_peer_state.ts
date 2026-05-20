import { im_peer_state } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ImPeerStateInsert } from '@core/db'

export const addImPeerState = async (values: ImPeerStateInsert) => {
	return env.db
		.insert(im_peer_state)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getImPeerState = async (where: SQL) => {
	return env.db
		.select()
		.from(im_peer_state)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const setImPeerState = async (where: SQL, values: Partial<ImPeerStateInsert>) => {
	return env.db
		.update(im_peer_state)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeImPeerState = async (where: SQL) => {
	return env.db
		.delete(im_peer_state)
		.where(where)
		.returning()
		.then(res => res[0])
}
