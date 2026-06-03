import type { Agent, Group as GroupRow } from '@core/db'
import type { ModelMessage, UIMessageChunk } from 'ai'
import type { Context, Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../types'

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
	leadership: 'none' | 'advisory'
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
	leadership: 'none' | 'advisory'
	exclusive: boolean
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
	leadership: 'none' | 'advisory'
	exclusive: boolean
	needs_write_lock: boolean
	error_message?: string | null
}

export interface GroupSyncPayload {
	id: string
	name: string
	description: string | null
}

export interface GroupMemberToolState {
	agent: Agent
	evaluation: GroupMemberEvaluation
	messages: Array<ModelMessage>
	originalMessage: Message
	turnId: string
	modelTools: any
	runtime: any
}

export interface GroupMemberPromptState {
	agent: Agent
	evaluation: GroupMemberEvaluation
	messages: Array<ModelMessage>
	originalMessage: Message
	turnId: string
	tools: GroupMemberToolState
	system: string
	stopWhen: Array<any>
}

export interface GroupMemberChunkState {
	agent: Agent
	evaluation: GroupMemberEvaluation
	turnId: string
	chunk: UIMessageChunk<MessageMetadata, MessageDataParts>
}

export interface GroupMemberDoneState {
	agent: Agent
	evaluation: GroupMemberEvaluation
	turnId: string
	responseMessage: Message
	durationParts: Array<MessagePartDurationUIPart>
}

export interface GroupMemberErrorState {
	agent: Agent
	evaluation: GroupMemberEvaluation
	turnId: string
	error: unknown
	manual: boolean
}

export interface GroupInitArgs {
	group_id?: string
}

export type LoadedGroup = GroupRow
