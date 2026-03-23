import { randomUUID } from 'crypto'
import { convertToModelMessages, smoothStream, streamText } from 'ai'

import type { CallSettings, Prompt, TextUIPart } from 'ai'
import type { EventEmitter } from 'events'
import type { ArgsInit, ChatEventRes, ChatOptions, Message, MessageMetadata } from './types'

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	options = {} as ChatOptions
	messages = [] as Array<Message>
	loading = false
	provider = null as unknown as Provider
	abort_controller = new AbortController()

	read = null as unknown as ArgsInit['read']
	write = null as unknown as ArgsInit['write']

	async init(args: ArgsInit) {
		const { id, event, read, write } = args

		this.id = id
		this.event = event
		this.read = read
		this.write = write

		const [{ loading }, { options, messages }, providers] = await Promise.all([
			read({ module: 'file_index', filename: id }),
			read({ module: 'chat', filename: id }),
			read({ module: 'global', filename: 'providers' })
		])

		this.loading = loading
		this.options = options
		this.messages = messages || []
		this.provider = providers[options.model.provider].config as Provider

		if (!this.messages.length && this.options.question) {
			return { type: 'ask', question: this.options.question } as ChatEventRes
		} else {
			return { type: 'init', messages: this.messages } as ChatEventRes
		}
	}

	getData() {
		return {
			type: 'getData',
			data: { loading: this.loading, options: this.options, messages: this.messages }
		} as ChatEventRes
	}

	getStream(messages: Array<Message>) {
		const { model, system_prompt, temperature, top_p, max_ouput_tokens } = this.options
		const { provider, value } = model

		this.messages = messages

		this.setLoading(true)

		const settings: CallSettings & Prompt = {}

		if (max_ouput_tokens) settings['maxOutputTokens'] = max_ouput_tokens
		if (system_prompt) settings['system'] = system_prompt

		const res = streamText({
			model: getProvider({ name: provider as ProviderKey, api_key: this.provider.api_key })!(value),
			temperature,
			topP: top_p,
			messages: convertToModelMessages(messages),
			abortSignal: this.abort_controller.signal,
			providerOptions: {
				google: {
					thinkingConfig: {
						includeThoughts: true
					}
				}
			},
			...settings,
			experimental_transform: smoothStream(),
			onAbort: this.onStop.bind(this),
			onError: this.onStop.bind(this)
		})

		let reasoning_start = 0
		let reasoning_end = 0

		return res.toUIMessageStream({
			originalMessages: messages,
			sendSources: true,
			generateMessageId: randomUUID,
			messageMetadata: ({ part }) => {
				if (part.type === 'reasoning-start') {
					reasoning_start = Date.now()
				}

				if (part.type === 'reasoning-end') {
					reasoning_end = Date.now()
				}

				if (part.type === 'finish') {
					const target = { usage: part.totalUsage, timestamp: Date.now() } as MessageMetadata

					if (reasoning_end) {
						target['reasoning_duration'] = reasoning_end - reasoning_start
					}

					reasoning_start = 0
					reasoning_end = 0

					return target
				}
			},
			onFinish: ({ messages }) => {
				this.onStop()
				this.persist(messages)
			}
		})
	}

	stopStream() {
		this.abort_controller.abort()
	}

	removeMessage(index: number) {
		this.messages.splice(index, 1)

		this.persist(this.messages)
	}

	updateMessage(args: { index: number; text: string }) {
		const { index, text } = args
		const message = this.messages[index]
		const part_index = message.parts.findIndex(item => item.type === 'text')

		if (part_index !== -1) {
			const part = message.parts[part_index] as TextUIPart

			part.text = text
		}

		this.persist(this.messages)
	}

	private async onStop() {
		this.setLoading(false)
	}

	private async setLoading(v: boolean) {
		this.loading = v

		this.event.emit(`${this.id}/CHANGE`, { type: 'sync_loading', loading: v } as ChatEventRes)

		await this.write({ module: 'file_index', filename: this.id, merge: true, data: { loading: v } })
	}

	async updateOptions() {
		const { options } = await this.read({ module: 'chat', filename: this.id })

		this.options = options
	}

	private async persist(messages: Array<Message>) {
		this.messages = messages

		await this.write({
			module: 'chat',
			filename: this.id,
			merge: true,
			data: { messages }
		})
	}

	public async abort() {
		await this.setLoading(false)

		this.abort_controller.abort()
	}
}
