import { group_todo } from '@core/db/schema'
import { getGroupTodo, setGroupTodo } from '@core/db/services'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import { acquireWriteLock, releaseWriteLock } from '../runtime/locks'

import type { Agent } from '@core/db'
import type Group from '../index'

const inputSchema = object({
	action: Enum(['acquire_lock', 'release_lock', 'claim_todo', 'complete_todo', 'fail_todo']),
	reason: string().optional(),
	todo_id: string().optional(),
	result: string().optional(),
	error: string().optional()
})

export const createGroupCoordinationTool = (s: Group, agent: Agent) => {
	return tool({
		description: [
			'Coordinate access to shared writes and shared todos inside the group runtime.',
			'Acquire the lock before using write-capable workspace tools.',
			'Claim a todo when you start executing it; complete or fail it when done.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			switch (input.action) {
				case 'acquire_lock':
					return acquireWriteLock(s, agent, input.reason)
				case 'release_lock':
					return releaseWriteLock(s, agent)
				case 'claim_todo': {
					if (!input.todo_id) {
						return { updated: false, error: 'todo_id is required' }
					}

					const target = await getGroupTodo(eq(group_todo.id, input.todo_id))

					if (!target) {
						return { updated: false, error: 'todo not found' }
					}

					await setGroupTodo(eq(group_todo.id, target.id), {
						status: 'processing',
						assignee_agent_id: agent.id,
						started_by_agent_id: target.started_by_agent_id ?? agent.id,
						started_at: target.started_at ?? new Date()
					})
					await s.getTasks()
					await s.setContext(
						{},
						{ agent_id: agent.id, agent_name: agent.name, turn_id: s.active_turn_id }
					)

					return { updated: true, todo_id: target.id, status: 'processing' }
				}
				case 'complete_todo': {
					if (!input.todo_id) {
						return { updated: false, error: 'todo_id is required' }
					}

					const target = await getGroupTodo(eq(group_todo.id, input.todo_id))

					if (!target) {
						return { updated: false, error: 'todo not found' }
					}

					await setGroupTodo(eq(group_todo.id, target.id), {
						status: 'done',
						result: input.result ?? target.result ?? undefined,
						assignee_agent_id: target.assignee_agent_id ?? agent.id,
						completed_by_agent_id: agent.id,
						started_at: target.started_at ?? new Date(),
						finished_at: new Date()
					})
					await s.getTasks()
					await s.setContext(
						{},
						{ agent_id: agent.id, agent_name: agent.name, turn_id: s.active_turn_id }
					)

					return { updated: true, todo_id: target.id, status: 'done' }
				}
				case 'fail_todo': {
					if (!input.todo_id) {
						return { updated: false, error: 'todo_id is required' }
					}

					const target = await getGroupTodo(eq(group_todo.id, input.todo_id))

					if (!target) {
						return { updated: false, error: 'todo not found' }
					}

					await setGroupTodo(eq(group_todo.id, target.id), {
						status: 'error',
						error: input.error ?? target.error ?? 'unknown error',
						assignee_agent_id: target.assignee_agent_id ?? agent.id,
						completed_by_agent_id: agent.id,
						started_at: target.started_at ?? new Date(),
						finished_at: new Date()
					})
					await s.getTasks()
					await s.setContext(
						{},
						{ agent_id: agent.id, agent_name: agent.name, turn_id: s.active_turn_id }
					)

					return { updated: true, todo_id: target.id, status: 'error' }
				}
				default:
					return releaseWriteLock(s, agent)
			}
		}
	})
}
