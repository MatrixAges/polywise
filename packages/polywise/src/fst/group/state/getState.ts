import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Group from '../index'
import type { GroupStateData } from '../types'

const default_state: GroupStateData = {
	archived_at: null,
	active_turn_id: null,
	write_lock: {
		agent_id: null,
		agent_name: null,
		acquired_at: null,
		reason: null
	},
	barrier: null
}

export default async (s: Group) => {
	const [err, res] = await to(fs.readJSON(s.state_dir))

	if (!err && res && typeof res === 'object') {
		const state = { ...default_state, ...(res as Partial<GroupStateData>) }

		s.archived_at = typeof state.archived_at === 'number' ? state.archived_at : null
		s.active_turn_id = state.active_turn_id ?? null
		s.write_lock = {
			...default_state.write_lock,
			...(state.write_lock || {})
		}
		s.barrier = state.barrier ?? null

		return
	}

	s.archived_at = null
	s.active_turn_id = null
	s.write_lock = { ...default_state.write_lock }
	s.barrier = null
}
