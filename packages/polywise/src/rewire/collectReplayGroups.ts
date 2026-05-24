import { env } from '@core/env'

import { getRewireConfig, rewire_event_fetch_limit_floor } from './constants'

import type { ReplayGroup } from './types'

interface RewireEventRow {
	id: string
	agent_id: string | null
	stimulus_key: string
	signal: string
	role: 'center' | 'accepted' | 'rejected' | 'neighbor'
	node_id: string
	strength: number
	created_at: number
}

export const groupRewireRows = (rows: Array<RewireEventRow>, max_groups: number) => {
	const groups = new Map<
		string,
		{
			agent_id: string | null
			stimulus_key: string
			signal: string
			event_ids: Array<string>
			center_node_ids: Set<string>
			accepted_node_ids: Set<string>
			rejected_node_ids: Set<string>
			total_strength: number
			last_event_at: number
		}
	>()

	for (const row of rows) {
		let group = groups.get(row.stimulus_key)

		if (!group) {
			group = {
				agent_id: row.agent_id ?? null,
				stimulus_key: row.stimulus_key,
				signal: row.signal,
				event_ids: [],
				center_node_ids: new Set<string>(),
				accepted_node_ids: new Set<string>(),
				rejected_node_ids: new Set<string>(),
				total_strength: 0,
				last_event_at: row.created_at
			}
			groups.set(row.stimulus_key, group)
		}

		group.event_ids.push(row.id)
		group.total_strength += Number(row.strength ?? 0)
		group.last_event_at = Math.max(group.last_event_at, Number(row.created_at ?? 0))

		if (row.role === 'center') {
			group.center_node_ids.add(row.node_id)
		} else if (row.role === 'accepted' || row.role === 'neighbor') {
			group.accepted_node_ids.add(row.node_id)
		} else if (row.role === 'rejected') {
			group.rejected_node_ids.add(row.node_id)
		}
	}

	return [...groups.values()]
		.map(
			group =>
				({
					agent_id: group.agent_id,
					stimulus_key: group.stimulus_key,
					signal: group.signal,
					event_ids: group.event_ids,
					center_node_ids: [...group.center_node_ids],
					accepted_node_ids: [...group.accepted_node_ids],
					rejected_node_ids: [...group.rejected_node_ids],
					total_strength: group.total_strength,
					last_event_at: group.last_event_at
				}) satisfies ReplayGroup
		)
		.filter(group => group.center_node_ids.length > 0 && group.accepted_node_ids.length > 0)
		.sort((a, b) => {
			if (b.last_event_at !== a.last_event_at) {
				return b.last_event_at - a.last_event_at
			}

			if (b.total_strength !== a.total_strength) {
				return b.total_strength - a.total_strength
			}

			return b.accepted_node_ids.length - a.accepted_node_ids.length
		})
		.slice(0, max_groups)
}

export default async (args: { agent_id: string | null }) => {
	const current_config = getRewireConfig()
	const limit = Math.max(current_config.max_groups_per_cycle * 20, rewire_event_fetch_limit_floor)
	const window_start = Date.now() - current_config.replay_window_ms
	const rows =
		args.agent_id === null
			? (env.sqlite
					.prepare(
						`
						SELECT id, agent_id, stimulus_key, signal, role, node_id, strength, created_at
						FROM rewire_event
						WHERE created_at >= ? AND agent_id is null
						ORDER BY created_at DESC
						LIMIT ?
					`
					)
					.all(window_start, limit) as Array<RewireEventRow>)
			: (env.sqlite
					.prepare(
						`
						SELECT id, agent_id, stimulus_key, signal, role, node_id, strength, created_at
						FROM rewire_event
						WHERE created_at >= ? AND agent_id = ?
						ORDER BY created_at DESC
						LIMIT ?
					`
					)
					.all(window_start, args.agent_id, limit) as Array<RewireEventRow>)

	return groupRewireRows(rows, current_config.max_groups_per_cycle)
}
