import { getToolName, isToolUIPart } from 'ai'

import { getReasoningDurationMs } from '../../duration'

import type { Message, MessageMetadata } from '../../types'
import type { ComplexitySignal } from './types'

const getUsageValue = (metadata: MessageMetadata | undefined, keys: Array<string>) => {
	const usage = metadata?.usage as Record<string, unknown> | undefined

	if (!usage) return 0

	for (const key of keys) {
		const value = usage[key]

		if (typeof value === 'number') return value
	}

	return 0
}

export default (args: { response_message: Message; recent_message_count: number }): ComplexitySignal => {
	const { response_message, recent_message_count } = args
	const metadata = response_message.metadata as MessageMetadata | undefined
	const tool_names = [] as Array<string>
	let error_count = 0

	for (const part of response_message.parts) {
		if (!isToolUIPart(part)) continue

		tool_names.push(getToolName(part))

		if (part.state === 'output-error') {
			error_count++
		}
	}

	const distinct_tool_count = new Set(tool_names).size
	const has_retry_pattern = new Set(tool_names).size < tool_names.length
	const retry_count = has_retry_pattern ? tool_names.length - new Set(tool_names).size : 0
	const reasoning_duration = getReasoningDurationMs(response_message.parts)
	const input_tokens = getUsageValue(metadata, ['inputTokens', 'promptTokens'])
	const output_tokens = getUsageValue(metadata, ['outputTokens', 'completionTokens'])
	const total_tokens = getUsageValue(metadata, ['totalTokens']) || input_tokens + output_tokens
	const has_error_pattern = error_count > 0
	const is_complex =
		tool_names.length >= 15 ||
		distinct_tool_count >= 12 ||
		reasoning_duration >= 30000 ||
		total_tokens >= 12000 ||
		has_error_pattern ||
		has_retry_pattern

	return {
		recent_message_count,
		tool_call_count: tool_names.length,
		distinct_tool_count,
		error_count,
		retry_count,
		has_error_pattern,
		has_retry_pattern,
		reasoning_duration,
		input_tokens,
		output_tokens,
		total_tokens,
		is_complex
	}
}
