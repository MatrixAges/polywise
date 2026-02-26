import dayjs from 'dayjs'

import { system } from '../consts'

import type { Edge } from '../types'

export default (edge: Edge) => {
	const { weight, updated_at } = edge

	const base_weight = typeof weight === 'number' ? weight : 0

	if (base_weight <= 0) return 0

	const timestamp = dayjs(updated_at).valueOf()
	const elapsed_hours = Math.max(0, (Date.now() - timestamp) / 3600000)

	const half_life = Math.max(system.context.context_sequence_time_half_life_hours, 1)
	const window_hours = Math.max(system.context.context_sequence_window_hours, 1)
	const time_decay = Math.pow(0.5, elapsed_hours / half_life)
	const window_count = Math.floor(elapsed_hours / window_hours)
	const window_decay = Math.pow(system.context.context_sequence_window_penalty, window_count)

	return base_weight * time_decay * window_decay
}
