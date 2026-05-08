import type { UIMessageChunk } from 'ai'
import type {
	Message,
	MessageDataParts,
	MessageMetadata,
	MessagePartDurationData,
	MessagePartDurationTargetType,
	MessagePartDurationUIPart
} from './types'

type MessageChunk = UIMessageChunk<MessageMetadata, MessageDataParts>

interface ToolDurationState {
	started_at: number
	target_type: MessagePartDurationTargetType
}

export interface PartDurationTracker {
	part_start_at: Map<string, number>
	tool_start_at: Map<string, ToolDurationState>
	completed_tool_calls: Set<string>
	next_data_part_index: number
}

const duration_padding_ms = 60

const getDurationMs = (started_at: number | undefined, now: number) => {
	if (started_at == null) return 0

	return Math.max(0, now - started_at + duration_padding_ms)
}

const getToolTargetType = (tool_name: string, dynamic?: boolean): MessagePartDurationTargetType => {
	return dynamic ? 'dynamic-tool' : `tool-${tool_name}`
}

const buildDurationPart = (data: MessagePartDurationData, tracker: PartDurationTracker): MessagePartDurationUIPart => {
	const current_index = tracker.next_data_part_index++

	return {
		type: 'data-part-duration',
		id: `part-duration:${data.targetType}:${data.targetId}:${current_index}`,
		data
	}
}

export const createPartDurationTracker = (): PartDurationTracker => {
	return {
		part_start_at: new Map(),
		tool_start_at: new Map(),
		completed_tool_calls: new Set(),
		next_data_part_index: 0
	}
}

export const isPartDurationPart = (part: Message['parts'][number]): part is MessagePartDurationUIPart => {
	return part.type === 'data-part-duration'
}

export const getReasoningDurationMs = (parts: Message['parts']): number => {
	return parts.reduce((total, part) => {
		if (!isPartDurationPart(part) || part.data.targetType !== 'reasoning') return total

		return total + part.data.duration
	}, 0)
}

export const getPartDurationChunk = (
	chunk: MessageChunk,
	tracker: PartDurationTracker,
	now = Date.now()
): MessagePartDurationUIPart | undefined => {
	switch (chunk.type) {
		case 'text-start':
		case 'reasoning-start':
			tracker.part_start_at.set(chunk.id, now)
			return
		case 'text-end': {
			const started_at = tracker.part_start_at.get(chunk.id)
			tracker.part_start_at.delete(chunk.id)

			return buildDurationPart(
				{
					targetId: chunk.id,
					targetType: 'text',
					duration: getDurationMs(started_at, now)
				},
				tracker
			)
		}
		case 'reasoning-end': {
			const started_at = tracker.part_start_at.get(chunk.id)
			tracker.part_start_at.delete(chunk.id)

			return buildDurationPart(
				{
					targetId: chunk.id,
					targetType: 'reasoning',
					duration: getDurationMs(started_at, now)
				},
				tracker
			)
		}
		case 'tool-input-start':
		case 'tool-input-available':
			if (!tracker.tool_start_at.has(chunk.toolCallId)) {
				tracker.tool_start_at.set(chunk.toolCallId, {
					started_at: now,
					target_type: getToolTargetType(chunk.toolName, chunk.dynamic)
				})
			}
			return
		case 'tool-input-error': {
			if (tracker.completed_tool_calls.has(chunk.toolCallId)) return

			tracker.completed_tool_calls.add(chunk.toolCallId)

			const target_type = getToolTargetType(chunk.toolName, chunk.dynamic)
			const state = tracker.tool_start_at.get(chunk.toolCallId)
			tracker.tool_start_at.delete(chunk.toolCallId)

			return buildDurationPart(
				{
					targetId: chunk.toolCallId,
					targetType: state?.target_type ?? target_type,
					duration: getDurationMs(state?.started_at, now)
				},
				tracker
			)
		}
		case 'tool-output-available':
			if (chunk.preliminary) return
		case 'tool-output-error':
		case 'tool-output-denied': {
			if (tracker.completed_tool_calls.has(chunk.toolCallId)) return

			tracker.completed_tool_calls.add(chunk.toolCallId)

			const state = tracker.tool_start_at.get(chunk.toolCallId)
			tracker.tool_start_at.delete(chunk.toolCallId)

			return buildDurationPart(
				{
					targetId: chunk.toolCallId,
					targetType: state?.target_type ?? 'tool-unknown',
					duration: getDurationMs(state?.started_at, now)
				},
				tracker
			)
		}
		case 'source-url':
			return buildDurationPart(
				{
					targetId: chunk.sourceId,
					targetType: 'source-url',
					duration: 0
				},
				tracker
			)
		case 'source-document':
			return buildDurationPart(
				{
					targetId: chunk.sourceId,
					targetType: 'source-document',
					duration: 0
				},
				tracker
			)
		case 'file':
			return buildDurationPart(
				{
					targetId: chunk.url,
					targetType: 'file',
					duration: 0
				},
				tracker
			)
		default:
			return
	}
}
