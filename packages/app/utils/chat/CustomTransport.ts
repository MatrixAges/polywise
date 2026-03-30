import { DefaultChatTransport } from 'ai'

import type { UIMessage } from 'ai'
import type { ChatRequestOptions } from 'ai'

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
	): Promise<ReadableStream<unknown>> {
		const { messages, chatId, abortSignal, body, headers, metadata } = args

		const last_message = messages.at(-1)

		const res = await fetch(this.#options.api, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify({
				id: chatId,
				message: last_message,
				...body,
				...metadata
			}),
			signal: abortSignal
		})

		if (!res.ok) {
			throw new Error(`API error: ${res.status}`)
		}

		return res.body as ReadableStream<unknown>
	}
}
