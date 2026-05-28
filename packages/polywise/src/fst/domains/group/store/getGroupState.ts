import { to } from 'await-to-js'
import fs from 'fs-extra'

import getDefaultGroupState from './getDefaultGroupState'

import type Session from '../../../session'

export default async (s: Session) => {
	const [err, res] = await to(fs.readJSON(s.state_dir))
	const defaultState = getDefaultGroupState()

	if (!err && res && typeof res === 'object') {
		const state = { ...defaultState, ...(res as Partial<typeof defaultState>) }

		s.archived_at = typeof state.archived_at === 'number' ? state.archived_at : null
		s.active_turn_id = state.active_turn_id ?? null
		s.write_lock = {
			...defaultState.write_lock,
			...(state.write_lock || {})
		}
		s.barrier = state.barrier ?? null
		s.reply_queue = Array.isArray(state.reply_queue) ? state.reply_queue : []

		return
	}

	s.archived_at = null
	s.active_turn_id = null
	s.write_lock = { ...defaultState.write_lock }
	s.barrier = null
	s.reply_queue = []
}
