import { DefaultChatTransport } from 'ai'
import { makeAutoObservable } from 'mobx'
import scroll from 'smooth-scroll-into-view-if-needed'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'

import { server_sys_session_url } from '@/appdata'
import { Util } from '@/models/common'
import { Chat, execUntil, rpc } from '@/utils'

import type { Session } from '@core/db'
import type { Message } from '@core/fst'
import type { AbstractChat, UIMessage } from 'ai'

@injectable()
export default class Index {
	id = ''
	wheeled = false
	auto_scroll = true
	show_scroll_button = false

	ref_container = null as unknown as HTMLDivElement
	ref_bottom_signal = null as unknown as HTMLDivElement
	visible_bottom_signal = false

	session = null as unknown as Session
	chat = null as unknown as Chat
	chat_signal = 0
	status = '' as AbstractChat<UIMessage>['status']
	messages = [] as AbstractChat<UIMessage>['messages']

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{
				util: false,
				id: false,
				auto_scroll: false,
				ref_container: false,
				ref_bottom_signal: false,
				visible_bottom_signal: false,
				status: false,
				messages: false,
				chat: false
			},
			{ autoBind: true }
		)
	}

	init(id: string) {
		this.id = id

		this.initChat()
		this.sub()
		this.on()

		execUntil(
			() => this.ref_bottom_signal,
			() => this.forceToBottom()
		)
	}

	initChat() {
		if (!this.chat) {
			this.chat = new Chat({
				id: this.id,
				throttle: 60,
				transport: new DefaultChatTransport({
					api: server_sys_session_url + '/session',
					prepareReconnectToStreamRequest: () => ({
						api: `${server_sys_session_url}?id=${this.id}`
					})
				}),
				generateId: uuidv4
			})
		}

		this.chat.resumeStream()
	}

	send(v: string) {
		this.chat.sendMessage({ text: v })

		this.scrollToBottom()
	}

	stop() {
		if (this.status !== 'streaming') return

		this.chat.stop()

		rpc.session.stop.mutate(this.id)
	}

	regenerate(index: number) {
		this.chat.regenerate({ messageId: this.messages[index].id })
	}

	test() {
		console.log('test')
	}

	forceToBottom() {
		let framer_id: number
		let check_times = 0

		const start = () => {
			this.scrollToBottom()

			cancelAnimationFrame(framer_id)

			framer_id = requestAnimationFrame(() => check())
		}

		const check = () => {
			check_times += 1

			if (this.wheeled || check_times > 12) {
				if (this.wheeled || this.visible_bottom_signal) {
					cancelAnimationFrame(framer_id)
				} else {
					check_times = 0

					start()
				}
			} else {
				start()
			}
		}

		start()
	}

	scrollToBottom(force?: boolean) {
		if (force) {
			this.forceToBottom()
		} else {
			scroll(this.ref_bottom_signal, { block: 'start', behavior: 'smooth' })
		}

		if (!this.auto_scroll) this.show_scroll_button = true
		if (this.show_scroll_button) this.show_scroll_button = false
	}

	onWheel() {
		if (!this.wheeled) this.wheeled = true

		if (!this.auto_scroll) return

		this.auto_scroll = false
	}

	onMessages() {
		if (this.status !== 'streaming' || !this.auto_scroll) {
			return
		}

		this.scrollToBottom()
	}

	sub() {
		const off = rpc.session.init.subscribe(this.id, {
			onData: res => {
				switch (res.type) {
					case 'init':
						const { session, messages } = res.data

						this.session = session as Session
						this.chat.setMessages(messages as unknown as Array<Message>)

						break
				}
			}
		})

		this.util.acts.push(off.unsubscribe)
	}

	update() {
		this.chat_signal += 1
	}

	on() {
		const off_status = this.chat['~registerStatusCallback'](() => {
			this.status = this.chat.status

			this.update()
		})

		const off_messages = this.chat['~registerMessagesCallback'](() => {
			this.messages = $copy(this.chat.messages)

			this.update()
			this.onMessages()
		}, 30)

		const off_error = this.chat['~registerErrorCallback'](() => {
			if (this.chat.error?.message) toast.error(this.chat.error.message)
		})

		this.util.acts.push(off_status, off_messages, off_error)
	}

	deinit() {
		this.util.deinit()
	}
}
