import { DefaultChatTransport } from 'ai'

import type { ChatRequestOptions, UIMessage, UIMessageChunk } from 'ai'

interface CustomTransportOptions {
	api: string
	prepareReconnectToStreamRequest?: () => { api?: string }
}

export default class CustomTransport<
	UI_MESSAGE extends UIMessage = UIMessage
> extends DefaultChatTransport<UI_MESSAGE> {
	#options: CustomTransportOptions

	constructor(options: CustomTransportOptions) {
		super(options)
		this.#options = options
	}

	override async sendMessages(
		args: {
			trigger: 'submit-message' | 'regenerate-message'
			chatId: string
			messageId: string | undefined
			messages: UI_MESSAGE[]
			abortSignal: AbortSignal | undefined
		} & ChatRequestOptions
	): Promise<ReadableStream<UIMessageChunk<UI_MESSAGE>>> {
		const { messages, chatId, abortSignal, body, headers, metadata } = args

		const last_message = messages.at(-1)

		const request_body: Record<string, unknown> = {
			id: chatId,
			message: last_message
		}

		if (body && typeof body === 'object') {
			Object.assign(request_body, body)
		}

		if (metadata && typeof metadata === 'object') {
			Object.assign(request_body, metadata)
		}

		const res = await fetch(this.#options.api, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			credentials: 'include',
			body: JSON.stringify(request_body),
			signal: abortSignal
		})

		if (!res.ok) {
			throw new Error(`API error: ${res.status}`)
		}

		return this.processResponseStream(res.body as ReadableStream<Uint8Array>) as ReadableStream<
			UIMessageChunk<UI_MESSAGE>
		>
	}
}
