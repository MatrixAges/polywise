import { throttle } from 'es-toolkit/compat'

import type { ChatState, ChatStatus, UIMessage } from 'ai'

export default class Index<UI_MESSAGE extends UIMessage> implements ChatState<UI_MESSAGE> {
	#messages: UI_MESSAGE[]
	#status: ChatStatus = 'ready'
	#error: Error | undefined = undefined

	#messagesCallbacks = new Set<() => void>()
	#statusCallbacks = new Set<() => void>()
	#errorCallbacks = new Set<() => void>()

	constructor(initialMessages: UI_MESSAGE[] = []) {
		this.#messages = initialMessages
	}

	get status(): ChatStatus {
		return this.#status
	}

	set status(newStatus: ChatStatus) {
		this.#status = newStatus

		this.#callStatusCallbacks()
	}

	get error() {
		return this.#error
	}

	set error(newError: Error | undefined) {
		this.#error = newError

		if (newError) this.#callErrorCallbacks()
	}

	get messages() {
		return this.#messages
	}

	set messages(v: UI_MESSAGE[]) {
		this.#messages = v

		this.#callMessagesCallbacks()
	}

	pushMessage(v: UI_MESSAGE) {
		this.#messages = this.#messages.concat(v)

		this.#callMessagesCallbacks()
	}

	popMessage() {
		this.#messages = this.#messages.slice(0, -1)

		this.#callMessagesCallbacks()
	}

	replaceMessage(index: number, v: UI_MESSAGE) {
		this.#messages = [...this.#messages.slice(0, index), v, ...this.#messages.slice(index + 1)]

		this.#callMessagesCallbacks()
	}

	removeMessage(index: number) {
		this.#messages.splice(index, 1)

		this.#callMessagesCallbacks()
	}

	snapshot<T>(v: T) {
		return $copy(v)
	}

	#callMessagesCallbacks() {
		this.#messagesCallbacks.forEach(callback => callback())
	}

	#callStatusCallbacks() {
		this.#statusCallbacks.forEach(callback => callback())
	}

	#callErrorCallbacks() {
		this.#errorCallbacks.forEach(callback => callback())
	}

	'~registerMessagesCallback'(onChange: () => void, throttleWaitMs?: number) {
		const callback = throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange

		this.#messagesCallbacks.add(callback)

		return () => this.#messagesCallbacks.delete(callback)
	}

	'~registerStatusCallback'(onChange: () => void) {
		this.#statusCallbacks.add(onChange)

		return () => this.#statusCallbacks.delete(onChange)
	}

	'~registerErrorCallback'(onChange: () => void) {
		this.#errorCallbacks.add(onChange)

		return () => this.#errorCallbacks.delete(onChange)
	}
}
