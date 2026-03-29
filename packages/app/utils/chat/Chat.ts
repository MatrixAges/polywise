import { AbstractChat } from 'ai'

import State from './State'

import type { ChatInit, UIMessage } from 'ai'

interface ArgsInit {
	throttle?: number
}

export default class Index<UI_MESSAGE extends UIMessage = UIMessage> extends AbstractChat<UI_MESSAGE> {
	#state: State<UI_MESSAGE>

	constructor(args: ChatInit<UI_MESSAGE> & ArgsInit) {
		const { messages, throttle, ...init } = args
		const state = new State(messages)

		super({ ...init, state })

		this.#state = state
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

	'~registerMessagesCallback'(onChange: () => void, throttle_wait_ms?: number) {
		return this.#state['~registerMessagesCallback'](onChange, throttle_wait_ms)
	}

	'~registerStatusCallback'(onChange: () => void) {
		return this.#state['~registerStatusCallback'](onChange)
	}

	'~registerErrorCallback'(onChange: () => void) {
		return this.#state['~registerErrorCallback'](onChange)
	}
}
