import { HABIT_REACTION_THRESHOLD, STIMULATION_MAX } from '../consts'
import * as sql from '../sql'

import type { Action } from '../types'

export async function handleHabitReaction(
	args: {
		query: string
		query_embedding: number[]
		initial_actions: Action[]
		habit_threshold: number
	},
	queryRaw: (sql: string, params?: any[]) => Promise<any>,
	stimulate: (node_id: number, intensity: number) => Promise<void>
) {
	const { query_embedding, initial_actions, habit_threshold } = args

	if (!query_embedding) return

	const nearest_stimulus = await queryRaw(sql.sql_find_nearest_node, [`[${query_embedding.join(',')}]`])

	if (nearest_stimulus.length === 0) return

	const stimulus = nearest_stimulus[0]

	if (
		stimulus.similarity > HABIT_REACTION_THRESHOLD &&
		(stimulus.activation >= stimulus.threshold || stimulus.potential >= stimulus.threshold)
	) {
		const habits = await queryRaw(sql.sql_find_strongest_habit, [stimulus.id])

		if (habits.length > 0 && habits[0].weight >= habit_threshold) {
			const h = habits[0]

			const fast_action: Action = {
				id: h.target_id,
				content: h.action,
				source: 'memory',
				rerankScore: 1.0,
				relevanceScore: 1.0,
				combinedScore: 1.0,
				stimulated: true,
				memoryStrength: h.weight,
				metadata: h.action_metadata || {}
			}

			if (!initial_actions.find(a => a.id === fast_action.id)) {
				initial_actions.unshift(fast_action)
			}

			await queryRaw(sql.sql_increment_reaction_count, [stimulus.id, h.target_id])
		}
	}

	await stimulate(stimulus.id, STIMULATION_MAX)
}

export async function getHabits(query_embedding: number[], queryRaw: (sql: string, params?: any[]) => Promise<any>) {
	if (!query_embedding) return []

	return (await queryRaw(sql.sql_find_nearest_node, [`[${query_embedding.join(',')}]`])) as any[]
}
