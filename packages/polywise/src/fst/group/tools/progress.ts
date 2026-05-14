import { tool } from 'ai'
import { array, enum as Enum, object, record, string } from 'zod'

import type { Agent } from '@core/db'
import type Group from '../index'
import type { GroupContext } from '../types'

const task_schema = object({
	todo_id: string().optional(),
	title: string(),
	desc: string(),
	status: Enum(['backlog', 'processing', 'unreview', 'done', 'canceled', 'error', 'archive']),
	result: string().optional(),
	error: string().optional(),
	assignee_agent_id: string().optional(),
	started_by_agent_id: string().optional(),
	completed_by_agent_id: string().optional(),
	started_at: string().optional(),
	finished_at: string().optional()
})

const inputSchema = object({
	intent: string().optional(),
	context: string().max(3000).optional(),
	shared_summary: string().max(3000).optional(),
	tasks: array(task_schema).optional(),
	files: array(
		object({
			path: string(),
			desc: string(),
			status: Enum(['read', 'modified', 'created', 'deleted']).optional()
		})
	).optional(),
	constraints: array(string()).optional(),
	learned: array(string()).optional(),
	environment: record(string(), string()).optional(),
	blockers: array(string()).optional()
})

const parseTime = (value?: string) => {
	if (!value) return undefined

	const timestamp = new Date(value).getTime()

	return Number.isFinite(timestamp) ? timestamp : undefined
}

export const createGroupProgressTool = (s: Group, agent: Agent) => {
	return tool({
		description: [
			'Update the shared group context and shared group todos when your work materially changes the group state.',
			'Use this when you clarify task status, shared progress, blockers, or file state.',
			'Do not use it for minor commentary.',
			'This is an internal state tool. After calling it, do not produce any additional user-facing summary in the same turn.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			await s.setContext(
				{
					...(input as Partial<GroupContext>),
					tasks: input.tasks?.map(item => ({
						...item,
						started_at: parseTime(item.started_at),
						finished_at: parseTime(item.finished_at)
					}))
				},
				{ agent_id: agent.id, agent_name: agent.name, turn_id: s.active_turn_id }
			)

			return { updated: true }
		}
	})
}
