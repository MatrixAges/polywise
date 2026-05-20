import { DefaultChatTransport, isToolUIPart } from 'ai'
import { getId } from 'stk/utils'

import State from './State'
import { applyUIMessageChunk, createStreamingUIMessageState } from './stream'

import type {
	ChatInit,
	ChatOnErrorCallback,
	ChatOnFinishCallback,
	ChatOnToolCallCallback,
	ChatRequestOptions,
	ChatStatus,
	CreateUIMessage,
	UIDataTypes,
	UIMessage,
	UIMessagePart,
	UITools
} from 'ai'

interface ArgsInit {
	throttle?: number
}

type ActiveResponse<UI_MESSAGE extends UIMessage> = {
	state: ReturnType<typeof createStreamingUIMessageState<UI_MESSAGE>>
	abortController: AbortController
}

export default class Index<UI_MESSAGE extends UIMessage = UIMessage> {
	readonly id: string
	readonly generateId: NonNullable<ChatInit<UI_MESSAGE>['generateId']>

	#state: State<UI_MESSAGE>
	#transport: NonNullable<ChatInit<UI_MESSAGE>['transport']>
	#onError?: ChatOnErrorCallback
	#onToolCall?: ChatOnToolCallCallback<UI_MESSAGE>
	#onFinish?: ChatOnFinishCallback<UI_MESSAGE>
	#onData?: ChatInit<UI_MESSAGE>['onData']
	#sendAutomaticallyWhen?: ChatInit<UI_MESSAGE>['sendAutomaticallyWhen']
	#activeResponse: ActiveResponse<UI_MESSAGE> | undefined = undefined

	constructor(args: ChatInit<UI_MESSAGE> & ArgsInit) {
		const { messages, throttle: _throttle, ...init } = args
		const state = new State(messages)

		this.id = init.id ?? getId()
		this.generateId = init.generateId ?? getId
		this.#state = state
		this.#transport = init.transport ?? new DefaultChatTransport<UI_MESSAGE>()
		this.#onError = init.onError
		this.#onToolCall = init.onToolCall
		this.#onFinish = init.onFinish
		this.#onData = init.onData
		this.#sendAutomaticallyWhen = init.sendAutomaticallyWhen
	}

	get status(): ChatStatus {
		return this.#state.status
	}

	get error() {
		return this.#state.error
	}

	get messages(): UI_MESSAGE[] {
		return this.#state.messages
	}

	get lastMessage(): UI_MESSAGE | undefined {
		return this.#state.messages[this.#state.messages.length - 1]
	}

	set messages(messages: UI_MESSAGE[]) {
		this.#state.messages = messages
	}

	setMessages(v: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])) {
		if (typeof v === 'function') {
			v = v(this.#state.messages)
		}

		this.#state.messages = v
	}

	removeMessage(index: number) {
		this.#state.removeMessage(index)
	}

	clearMessages() {
		this.#state.clearMessages()
	}

	clearError() {
		if (this.status === 'error') {
			this.#state.error = undefined
			this.#setStatus({ status: 'ready' })
		}
	}

	'~registerMessagesCallback'(onChange: () => void, throttle_wait_ms?: number) {
		return this.#state['~registerMessagesCallback'](onChange, throttle_wait_ms)
	}

	'~registerStatusCallback'(onChange: () => void) {
		return this.#state['~registerStatusCallback'](onChange)
	}

	'~registerErrorCallback'(onChange: () => void) {
		return this.#state['~registerErrorCallback'](onChange)
	}

	sendMessage = async (
		message?:
			| (CreateUIMessage<UI_MESSAGE> & {
					text?: never
					messageId?: string
			  })
			| {
					text: string
					metadata?: UI_MESSAGE['metadata']
					messageId?: string
			  },
		options?: ChatRequestOptions
	) => {
		if (message == null) {
			await this.#makeRequest({
				trigger: 'submit-message',
				messageId: this.lastMessage?.id,
				...options
			})
			return
		}

		const ui_message = (
			'text' in message
				? ({
						parts: [{ type: 'text', text: message.text }]
					} as UI_MESSAGE)
				: message
		) as CreateUIMessage<UI_MESSAGE> & { messageId?: string; metadata?: UI_MESSAGE['metadata'] }

		if (message.messageId != null) {
			const message_index = this.#state.messages.findIndex(item => item.id === message.messageId)

			if (message_index === -1) {
				throw new Error(`message with id ${message.messageId} not found`)
			}

			if (this.#state.messages[message_index].role !== 'user') {
				throw new Error(`message with id ${message.messageId} is not a user message`)
			}

			this.#state.messages = this.#state.messages.slice(0, message_index + 1)
			this.#state.replaceMessage(message_index, {
				...ui_message,
				id: message.messageId,
				role: ui_message.role ?? 'user',
				metadata: message.metadata
			} as UI_MESSAGE)
		} else {
			this.#state.pushMessage({
				...ui_message,
				id: ui_message.id ?? this.generateId(),
				role: ui_message.role ?? 'user',
				metadata: message.metadata
			} as UI_MESSAGE)
		}

		await this.#makeRequest({
			trigger: 'submit-message',
			messageId: message.messageId,
			...options
		})
	}

	regenerate = async (
		args: {
			messageId?: string
		} & ChatRequestOptions = {}
	) => {
		const { messageId, ...options } = args
		const message_index =
			messageId == null
				? this.#state.messages.length - 1
				: this.#state.messages.findIndex(message => message.id === messageId)

		if (message_index === -1) {
			throw new Error(`message ${messageId} not found`)
		}

		this.#state.messages = this.#state.messages.slice(
			0,
			this.messages[message_index].role === 'assistant' ? message_index : message_index + 1
		)

		await this.#makeRequest({
			trigger: 'regenerate-message',
			messageId,
			...options
		})
	}

	resumeStream = async (options: ChatRequestOptions = {}) => {
		await this.#makeRequest({ trigger: 'resume-stream', ...options })
	}

	stop = async () => {
		if (this.status !== 'streaming' && this.status !== 'submitted') return

		this.#activeResponse?.abortController.abort()
	}

	addToolApprovalResponse = async (args: {
		id: string
		approved: boolean
		reason?: string
		options?: ChatRequestOptions
	}) => {
		const { id, approved, reason, options } = args

		const update_part = (part: UIMessagePart<UIDataTypes, UITools>) =>
			isToolUIPart(part) && part.state === 'approval-requested' && (part as any).approval?.id === id
				? ({
						...part,
						state: 'approval-responded',
						approval: { id, approved, reason }
					} as UIMessagePart<UIDataTypes, UITools>)
				: part

		const messages = this.#state.messages
		const last_message = messages[messages.length - 1]

		if (!last_message) return

		this.#state.replaceMessage(messages.length - 1, {
			...last_message,
			parts: last_message.parts.map(update_part)
		})

		if (this.#activeResponse) {
			this.#activeResponse.state.message.parts = this.#activeResponse.state.message.parts.map(
				update_part
			) as any
		}

		if (this.status !== 'streaming' && this.status !== 'submitted' && (await this.#shouldSendAutomatically())) {
			void this.#makeRequest({
				trigger: 'submit-message',
				messageId: this.lastMessage?.id,
				...options
			})
		}
	}

	addToolOutput = async <TOOL extends keyof UI_MESSAGE['tools'] & string>(
		args: {
			tool: TOOL
			toolCallId: string
			options?: ChatRequestOptions
		} & (
			| {
					state?: 'output-available'
					output: any
					errorText?: never
			  }
			| {
					state: 'output-error'
					output?: never
					errorText: string
			  }
		)
	) => {
		const { state = 'output-available', toolCallId, output, errorText, options } = args as any
		const messages = this.#state.messages
		const last_message = messages[messages.length - 1]

		if (!last_message) return

		const update_part = (part: UIMessagePart<UIDataTypes, UITools>) =>
			isToolUIPart(part) && (part as any).toolCallId === toolCallId
				? ({ ...part, state, output, errorText } as UIMessagePart<UIDataTypes, UITools>)
				: part

		this.#state.replaceMessage(messages.length - 1, {
			...last_message,
			parts: last_message.parts.map(update_part)
		})

		if (this.#activeResponse) {
			this.#activeResponse.state.message.parts = this.#activeResponse.state.message.parts.map(
				update_part
			) as any
		}

		if (this.status !== 'streaming' && this.status !== 'submitted' && (await this.#shouldSendAutomatically())) {
			void this.#makeRequest({
				trigger: 'submit-message',
				messageId: this.lastMessage?.id,
				...options
			})
		}
	}

	addToolResult = this.addToolOutput

	#setStatus(args: { status: ChatStatus; error?: Error }) {
		const { status, error } = args

		if (this.#state.status === status) return

		this.#state.status = status
		this.#state.error = error
	}

	async #shouldSendAutomatically() {
		if (!this.#sendAutomaticallyWhen) return false

		return await this.#sendAutomaticallyWhen({
			messages: this.#state.messages
		})
	}

	#writeActiveMessage(active_response: ActiveResponse<UI_MESSAGE>) {
		this.#setStatus({ status: 'streaming' })

		const active_message = active_response.state.message
		const last_message = this.lastMessage

		if (active_message.id === last_message?.id) {
			this.#state.replaceMessage(this.#state.messages.length - 1, active_message)
			return
		}

		this.#state.pushMessage(active_message)
	}

	async #makeRequest(
		args: {
			trigger: 'submit-message' | 'resume-stream' | 'regenerate-message'
			messageId?: string
		} & ChatRequestOptions
	) {
		const { trigger, metadata, headers, body, messageId } = args
		let resume_stream = undefined as ReadableStream<any> | undefined

		if (trigger === 'resume-stream') {
			try {
				resume_stream = await this.#transport.reconnectToStream({
					chatId: this.id,
					metadata,
					headers,
					body
				})

				if (resume_stream == null) {
					return
				}
			} catch (err) {
				if (this.#onError && err instanceof Error) {
					this.#onError(err)
				}
				this.#setStatus({ status: 'error', error: err as Error })
				return
			}
		}

		this.#setStatus({ status: 'submitted', error: undefined })

		const last_message = this.lastMessage
		let is_abort = false
		let is_disconnect = false
		let is_error = false

		try {
			const active_response = {
				state: createStreamingUIMessageState({
					lastMessage: this.#state.snapshot(last_message),
					messageId: this.generateId()
				}),
				abortController: new AbortController()
			} satisfies ActiveResponse<UI_MESSAGE>

			active_response.abortController.signal.addEventListener('abort', () => {
				is_abort = true
			})

			this.#activeResponse = active_response

			const stream =
				trigger === 'resume-stream'
					? resume_stream!
					: await this.#transport.sendMessages({
							chatId: this.id,
							messages: this.#state.messages,
							abortSignal: active_response.abortController.signal,
							metadata,
							headers,
							body,
							trigger,
							messageId
						})

			const reader = stream.getReader()

			while (true) {
				const { done, value } = await reader.read()

				if (done) break

				const chunk = value as any

				if (chunk?.type === 'error' && chunk.errorText) {
					throw new Error(chunk.errorText)
				}

				if (chunk?.type === 'abort') {
					is_abort = true
					continue
				}

				await applyUIMessageChunk({
					state: active_response.state,
					chunk,
					write: () => this.#writeActiveMessage(active_response),
					onToolCall: this.#onToolCall,
					onData: this.#onData
				})
			}

			this.#setStatus({ status: 'ready' })
		} catch (err) {
			if (is_abort || (err as any).name === 'AbortError') {
				is_abort = true
				this.#setStatus({ status: 'ready' })
				return
			}

			is_error = true

			if (
				err instanceof TypeError &&
				(err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network'))
			) {
				is_disconnect = true
			}

			if (this.#onError && err instanceof Error) {
				this.#onError(err)
			}

			this.#setStatus({ status: 'error', error: err as Error })
		} finally {
			try {
				this.#onFinish?.({
					message: this.#activeResponse!.state.message,
					messages: this.#state.messages,
					isAbort: is_abort,
					isDisconnect: is_disconnect,
					isError: is_error,
					finishReason: this.#activeResponse?.state.finishReason as any
				})
			} catch (err) {
				console.error(err)
			}

			this.#activeResponse = undefined
		}

		if (!is_error && (await this.#shouldSendAutomatically())) {
			await this.#makeRequest({
				trigger: 'submit-message',
				messageId: this.lastMessage?.id,
				metadata,
				headers,
				body
			})
		}
	}
}
