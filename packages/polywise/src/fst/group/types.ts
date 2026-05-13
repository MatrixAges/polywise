import type { Agent, Group as GroupRow } from '@core/db'
import type { Context } from '../types'

type BaseTaskContextItem = NonNullable<Context['tasks']>[number]

export interface GroupTaskContextItem extends BaseTaskContextItem {
	todo_id?: string
	assignee_agent_id?: string | null
	started_by_agent_id?: string | null
	completed_by_agent_id?: string | null
	started_at?: number | null
	finished_at?: number | null
}

export interface GroupAgentSummary {
	id: string
	name: string
	role: string
	description: string | null
}

export interface GroupContext extends Context {
	group_name?: string
	group_description?: string
	shared_summary?: string
	active_turn_id?: string | null
	active_agent_id?: string | null
	active_agent_name?: string | null
	tasks?: Array<GroupTaskContextItem>
}

export interface GroupWriteLock {
	agent_id: string | null
	agent_name: string | null
	acquired_at: number | null
	reason?: string | null
}

export interface GroupBarrierState {
	leader_agent_id: string | null
	leader_agent_name: string | null
	leadership: 'none' | 'advisory' | 'blocking'
	waiting_agent_ids: Array<string>
	reason?: string | null
}

export interface GroupReplyQueueItem {
	turn_id: string
	queue_index: number
	agent_id: string
	agent_name: string
	status: 'queued' | 'running' | 'done' | 'failed'
	reason: string
	confidence: 'low' | 'medium' | 'high'
	leadership: 'none' | 'advisory' | 'blocking'
	needs_write_lock: boolean
	enqueued_at: number
	started_at?: number | null
	finished_at?: number | null
	error?: string | null
}

export interface GroupStateData {
	archived_at: number | null
	active_turn_id: string | null
	write_lock: GroupWriteLock
	barrier: GroupBarrierState | null
	reply_queue: Array<GroupReplyQueueItem>
}

export interface GroupMemberEvaluation {
	agent: Agent
	should_answer: boolean
	reason: string
	confidence: 'low' | 'medium' | 'high'
	leadership: 'none' | 'advisory' | 'blocking'
	needs_write_lock: boolean
}

export interface GroupSyncPayload {
	id: string
	name: string
	description: string | null
}

export interface GroupInitArgs {
	group_id?: string
}

export type LoadedGroup = GroupRow
