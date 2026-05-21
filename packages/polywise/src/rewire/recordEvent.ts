import { env } from '@core/env'
import { getId } from 'stk/utils'

import { getRewireConfig } from './constants'

import type { RewireEventInput } from './types'

const normalizeEvents = (events: RewireEventInput['events']) => {
	const map = new Map<
		string,
		{ node_id: string; role: RewireEventInput['events'][number]['role']; strength: number }
	>()

	for (const item of events) {
		const node_id = item.node_id?.trim()

		if (!node_id) {
			continue
		}

		const key = `${item.role}:${node_id}`
		const prev = map.get(key)
		const strength = Math.max(Number(item.strength ?? 1) || 0, 0.01)

		if (!prev || strength > prev.strength) {
			map.set(key, {
				node_id,
				role: item.role,
				strength
			})
		}
	}

	return [...map.values()]
}

export default async (input: RewireEventInput) => {
	if (!getRewireConfig().enabled) {
		return { inserted: 0, skipped: true }
	}

	const events = normalizeEvents(input.events)

	env.rewire?.touchForeground?.()

	if (events.length === 0) {
		return { inserted: 0 }
	}

	const now = Date.now()
	const insert = env.sqlite.prepare(`
		INSERT INTO rewire_event (
			id, agent_id, session_id, stimulus_key, signal, role, node_id, strength, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)

	const run = env.sqlite.transaction(() => {
		for (const item of events) {
			insert.run(
				getId(),
				input.agent_id ?? null,
				input.session_id ?? null,
				input.stimulus_key,
				input.signal,
				item.role,
				item.node_id,
				item.strength,
				now
			)
		}
	})

	run()

	return { inserted: events.length }
}
