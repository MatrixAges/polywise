import { tool } from 'ai'
import { array, object, string } from 'zod'

import type Group from '../index'
import type { GroupPickedAgent } from '../types'

const inputSchema = object({
	picks: array(
		object({
			agent_id: string().describe('One candidate agent id from the group agents map'),
			reason: string().describe('Why this member should be confirmed first for the current turn')
		})
	)
		.max(3)
		.describe('Select up to 3 members that should be confirmed first')
})

export const createGroupPickTool = (s: Group, onPick: (picks: Array<GroupPickedAgent>) => void) =>
	tool({
		description: [
			'Pick which group members should be confirmed first for the current user turn.',
			'Only choose ids from the preloaded group agents map.',
			'Prefer fewer picks. Return an empty list when no member stands out.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const seen = new Set<string>()
			const picks = [] as Array<GroupPickedAgent>

			for (const item of input.picks) {
				const target = s.agents_map.find(agent => agent.id === item.agent_id)

				if (!target || seen.has(target.id)) {
					continue
				}

				seen.add(target.id)
				picks.push({
					agent_id: target.id,
					agent_name: target.name,
					reason: item.reason.trim()
				})
			}

			onPick(picks)

			return {
				picked: picks,
				total: picks.length
			}
		}
	})
