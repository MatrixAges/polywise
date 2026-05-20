import { getStaticToolName, isToolUIPart } from 'ai'

import type { UIMessage, UIMessageChunk } from 'ai'

export interface StreamingUIMessageState<UI_MESSAGE extends UIMessage> {
	message: UI_MESSAGE
	activeTextParts: Record<string, any>
	activeReasoningParts: Record<string, any>
	partialToolCalls: Record<
		string,
		{
			text: string
			toolName: string
			dynamic?: boolean
			title?: string
			toolMetadata?: Record<string, unknown>
		}
	>
	finishReason?: string
}

const createAssistantMessage = <UI_MESSAGE extends UIMessage>(message_id = '') =>
	({
		id: message_id,
		role: 'assistant',
		metadata: undefined,
		parts: []
	}) as UI_MESSAGE

export const createStreamingUIMessageState = <UI_MESSAGE extends UIMessage>(args: {
	lastMessage: UI_MESSAGE | undefined
	messageId: string
}) => {
	const { lastMessage, messageId } = args

	return {
		message:
			lastMessage?.role === 'assistant'
				? (structuredClone(lastMessage) as UI_MESSAGE)
				: createAssistantMessage(messageId),
		activeTextParts: {},
		activeReasoningParts: {},
		partialToolCalls: {}
	} satisfies StreamingUIMessageState<UI_MESSAGE>
}

const hasMessageContent = <UI_MESSAGE extends UIMessage>(state: StreamingUIMessageState<UI_MESSAGE>) =>
	state.message.parts.length > 0 ||
	state.message.metadata != null ||
	Object.keys(state.activeTextParts).length > 0 ||
	Object.keys(state.activeReasoningParts).length > 0 ||
	Object.keys(state.partialToolCalls).length > 0

const resetForNewMessage = <UI_MESSAGE extends UIMessage>(
	state: StreamingUIMessageState<UI_MESSAGE>,
	message_id: string
) => {
	state.message = createAssistantMessage<UI_MESSAGE>(message_id)
	state.activeTextParts = {}
	state.activeReasoningParts = {}
	state.partialToolCalls = {}
	state.finishReason = undefined
}

const mergeMetadata = <T>(current: T | undefined, next: T | undefined) => {
	if (next == null) {
		return current
	}

	if (current == null || typeof current !== 'object' || typeof next !== 'object') {
		return next
	}

	return { ...(current as Record<string, unknown>), ...(next as Record<string, unknown>) } as T
}

const parseToolInput = (text: string) => {
	if (!text.trim()) {
		return ''
	}

	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

const getToolPart = <UI_MESSAGE extends UIMessage>(state: StreamingUIMessageState<UI_MESSAGE>, tool_call_id: string) =>
	state.message.parts.find(part => isToolUIPart(part) && part.toolCallId === tool_call_id) as any

const upsertToolPart = <UI_MESSAGE extends UIMessage>(
	state: StreamingUIMessageState<UI_MESSAGE>,
	options: {
		toolCallId: string
		toolName: string
		dynamic?: boolean
		state: string
		input?: unknown
		rawInput?: unknown
		output?: unknown
		errorText?: string
		preliminary?: boolean
		providerExecuted?: boolean
		title?: string
		toolMetadata?: Record<string, unknown>
		providerMetadata?: unknown
	}
) => {
	const part = getToolPart(state, options.toolCallId)

	if (part) {
		part.state = options.state
		part.input = options.input
		part.rawInput = options.rawInput
		part.output = options.output
		part.errorText = options.errorText
		part.preliminary = options.preliminary
		part.providerExecuted = options.providerExecuted ?? part.providerExecuted
		part.title = options.title ?? part.title
		part.toolMetadata = options.toolMetadata ?? part.toolMetadata

		if (options.providerMetadata != null) {
			if (options.state === 'output-available' || options.state === 'output-error') {
				part.resultProviderMetadata = options.providerMetadata
			} else {
				part.callProviderMetadata = options.providerMetadata
			}
		}

		return part
	}

	const next_part = {
		type: options.dynamic ? 'dynamic-tool' : (`tool-${options.toolName}` as const),
		toolName: options.dynamic ? options.toolName : undefined,
		toolCallId: options.toolCallId,
		state: options.state,
		title: options.title,
		toolMetadata: options.toolMetadata,
		input: options.input,
		rawInput: options.rawInput,
		output: options.output,
		errorText: options.errorText,
		providerExecuted: options.providerExecuted,
		preliminary: options.preliminary
	} as any

	if (options.providerMetadata != null) {
		if (options.state === 'output-available' || options.state === 'output-error') {
			next_part.resultProviderMetadata = options.providerMetadata
		} else {
			next_part.callProviderMetadata = options.providerMetadata
		}
	}

	state.message.parts.push(next_part)

	return next_part
}

const appendDataPart = <UI_MESSAGE extends UIMessage>(
	state: StreamingUIMessageState<UI_MESSAGE>,
	chunk: { type: string; id?: string; data: unknown }
) => {
	state.message.parts.push({
		type: chunk.type,
		...(chunk.id ? { id: chunk.id } : {}),
		data: chunk.data
	} as any)
}

export const applyUIMessageChunk = async <UI_MESSAGE extends UIMessage>(args: {
	state: StreamingUIMessageState<UI_MESSAGE>
	chunk: UIMessageChunk
	write: () => void
	onToolCall?: (args: { toolCall: any }) => void | Promise<void>
	onData?: (dataPart: any) => void
}) => {
	const { state, chunk, write, onToolCall, onData } = args

	switch (chunk.type) {
		case 'text-start': {
			const part = {
				type: 'text',
				text: '',
				providerMetadata: chunk.providerMetadata,
				state: 'streaming'
			}
			state.activeTextParts[chunk.id] = part
			state.message.parts.push(part as any)
			write()
			return
		}

		case 'text-delta': {
			const part = state.activeTextParts[chunk.id]
			if (!part) return
			part.text += chunk.delta
			part.providerMetadata = chunk.providerMetadata ?? part.providerMetadata
			write()
			return
		}

		case 'text-end': {
			const part = state.activeTextParts[chunk.id]
			if (!part) return
			part.state = 'done'
			part.providerMetadata = chunk.providerMetadata ?? part.providerMetadata
			delete state.activeTextParts[chunk.id]
			write()
			return
		}

		case 'reasoning-start': {
			const part = {
				type: 'reasoning',
				text: '',
				providerMetadata: chunk.providerMetadata,
				state: 'streaming'
			}
			state.activeReasoningParts[chunk.id] = part
			state.message.parts.push(part as any)
			write()
			return
		}

		case 'reasoning-delta': {
			const part = state.activeReasoningParts[chunk.id]
			if (!part) return
			part.text += chunk.delta
			part.providerMetadata = chunk.providerMetadata ?? part.providerMetadata
			write()
			return
		}

		case 'reasoning-end': {
			const part = state.activeReasoningParts[chunk.id]
			if (!part) return
			part.state = 'done'
			part.providerMetadata = chunk.providerMetadata ?? part.providerMetadata
			delete state.activeReasoningParts[chunk.id]
			write()
			return
		}

		case 'tool-input-start': {
			state.partialToolCalls[chunk.toolCallId] = {
				text: '',
				toolName: chunk.toolName,
				dynamic: chunk.dynamic,
				title: chunk.title,
				toolMetadata: chunk.toolMetadata
			}
			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: chunk.toolName,
				dynamic: chunk.dynamic,
				state: 'input-streaming',
				input: '',
				title: chunk.title,
				toolMetadata: chunk.toolMetadata,
				providerExecuted: chunk.providerExecuted,
				providerMetadata: chunk.providerMetadata
			})
			write()
			return
		}

		case 'tool-input-delta': {
			const partial = state.partialToolCalls[chunk.toolCallId]
			if (!partial) return
			partial.text += chunk.inputTextDelta
			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: partial.toolName,
				dynamic: partial.dynamic,
				state: 'input-streaming',
				input: parseToolInput(partial.text),
				title: partial.title,
				toolMetadata: partial.toolMetadata
			})
			write()
			return
		}

		case 'tool-input-available': {
			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: chunk.toolName,
				dynamic: chunk.dynamic,
				state: 'input-available',
				input: chunk.input,
				title: chunk.title,
				toolMetadata: chunk.toolMetadata,
				providerExecuted: chunk.providerExecuted,
				providerMetadata: chunk.providerMetadata
			})
			write()

			if (onToolCall && !chunk.providerExecuted) {
				await onToolCall({ toolCall: chunk })
			}
			return
		}

		case 'tool-input-error': {
			const existing = getToolPart(state, chunk.toolCallId)
			const is_dynamic = existing ? existing.type === 'dynamic-tool' : !!chunk.dynamic

			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: chunk.toolName,
				dynamic: is_dynamic,
				state: 'output-error',
				input: is_dynamic ? chunk.input : undefined,
				rawInput: is_dynamic ? undefined : chunk.input,
				errorText: chunk.errorText,
				toolMetadata: chunk.toolMetadata,
				providerExecuted: chunk.providerExecuted,
				providerMetadata: chunk.providerMetadata
			})
			write()
			return
		}

		case 'tool-approval-request': {
			const part = getToolPart(state, chunk.toolCallId)
			if (!part) return
			part.state = 'approval-requested'
			part.approval = { id: chunk.approvalId }
			write()
			return
		}

		case 'tool-output-denied': {
			const part = getToolPart(state, chunk.toolCallId)
			if (!part) return
			part.state = 'output-denied'
			write()
			return
		}

		case 'tool-output-available': {
			const part = getToolPart(state, chunk.toolCallId)
			if (!part) return
			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: part.type === 'dynamic-tool' ? part.toolName : getStaticToolName(part),
				dynamic: part.type === 'dynamic-tool',
				state: 'output-available',
				input: part.input,
				output: chunk.output,
				preliminary: chunk.preliminary,
				title: part.title,
				toolMetadata: part.toolMetadata,
				providerExecuted: chunk.providerExecuted,
				providerMetadata: chunk.providerMetadata
			})
			write()
			return
		}

		case 'tool-output-error': {
			const part = getToolPart(state, chunk.toolCallId)
			if (!part) return
			upsertToolPart(state, {
				toolCallId: chunk.toolCallId,
				toolName: part.type === 'dynamic-tool' ? part.toolName : getStaticToolName(part),
				dynamic: part.type === 'dynamic-tool',
				state: 'output-error',
				input: part.input,
				rawInput: part.rawInput,
				errorText: chunk.errorText,
				title: part.title,
				toolMetadata: part.toolMetadata,
				providerExecuted: chunk.providerExecuted,
				providerMetadata: chunk.providerMetadata
			})
			write()
			return
		}

		case 'source-url': {
			state.message.parts.push({
				type: 'source-url',
				sourceId: chunk.sourceId,
				url: chunk.url,
				title: chunk.title,
				providerMetadata: chunk.providerMetadata
			} as any)
			write()
			return
		}

		case 'source-document': {
			state.message.parts.push({
				type: 'source-document',
				sourceId: chunk.sourceId,
				mediaType: chunk.mediaType,
				title: chunk.title,
				filename: chunk.filename,
				providerMetadata: chunk.providerMetadata
			} as any)
			write()
			return
		}

		case 'file': {
			state.message.parts.push({
				type: 'file',
				mediaType: chunk.mediaType,
				url: chunk.url,
				providerMetadata: chunk.providerMetadata
			} as any)
			write()
			return
		}

		case 'start-step': {
			state.message.parts.push({ type: 'step-start' } as any)
			return
		}

		case 'finish-step': {
			state.activeTextParts = {}
			state.activeReasoningParts = {}
			return
		}

		case 'start': {
			if (chunk.messageId != null && chunk.messageId !== state.message.id && hasMessageContent(state)) {
				resetForNewMessage(state, chunk.messageId)
			} else if (chunk.messageId != null) {
				state.message.id = chunk.messageId
			}

			state.message.metadata = mergeMetadata(state.message.metadata, chunk.messageMetadata as any)

			if (chunk.messageId != null || chunk.messageMetadata != null) {
				write()
			}
			return
		}

		case 'finish': {
			if (chunk.finishReason != null) {
				state.finishReason = chunk.finishReason
			}

			state.message.metadata = mergeMetadata(state.message.metadata, chunk.messageMetadata as any)

			if (chunk.messageMetadata != null) {
				write()
			}
			return
		}

		case 'message-metadata': {
			state.message.metadata = mergeMetadata(state.message.metadata, chunk.messageMetadata as any)
			if (chunk.messageMetadata != null) {
				write()
			}
			return
		}

		case 'abort':
		case 'error':
			return

		default: {
			if (String(chunk.type).startsWith('data-')) {
				if ((chunk as any).transient) {
					onData?.(chunk as any)
					return
				}

				appendDataPart(state, chunk as any)
				write()
			}
		}
	}
}
