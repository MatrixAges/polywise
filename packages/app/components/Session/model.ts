import { makeAutoObservable } from 'mobx'
import scroll from 'smooth-scroll-into-view-if-needed'
import { toast } from 'sonner'
import { getId } from 'stk/utils'
import { injectable } from 'tsyringe'

import { server_sys_session_url } from '@/appdata'
import { Util } from '@/models/common'
import { alert, Chat, CustomTransport, execUntil, rpc } from '@/utils'

import type { Session } from '@core/db'
import type { Message } from '@core/fst'
import type { AbstractChat, UIMessage } from 'ai'

@injectable()
export default class Index {
	id = ''
	ref_container = null as unknown as HTMLDivElement
	ref_top_signal = null as unknown as HTMLDivElement
	ref_bottom_signal = null as unknown as HTMLDivElement
	wheeled = false
	auto_scroll = true

	has_older = false
	has_newer = false

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
				ref_container: false,
				ref_top_signal: false,
				ref_bottom_signal: false,
				wheeled: false,
				auto_scroll: false,
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
				transport: new CustomTransport({
					api: server_sys_session_url,
					prepareReconnectToStreamRequest: () => ({
						api: `${server_sys_session_url}?id=${this.id}`
					})
				}),
				generateId: getId
			})
		}

		this.chat.resumeStream()
	}

	sub() {
		const off = rpc.session.init.subscribe(
			{ id: this.id, global: true },
			{
				onData: res => {
					switch (res.type) {
						case 'init':
						case 'sync':
							const { session, messages, has_older, has_newer } = res.data

							this.session = session as Session
							this.has_older = has_older
							this.has_newer = has_newer
							this.chat.setMessages(messages as unknown as Array<Message>)
							break
					}
				}
			}
		)

		this.util.acts.push(off.unsubscribe)
	}

	send(v: string) {
		this.chat.sendMessage({ text: v })

		this.scrollToBottom({ force: true })
	}

	stop() {
		if (this.status !== 'streaming') return

		this.chat.stop()

		rpc.session.stop.mutate(this.id)
	}

	forceToBottom() {
		let framer_id: number
		let check_times = 0

		const start = () => {
			this.scrollToBottom({ instant: true })

			cancelAnimationFrame(framer_id)

			framer_id = requestAnimationFrame(() => check())
		}

		const check = () => {
			check_times += 1

			if (this.wheeled || check_times > 12) {
				if (this.wheeled) {
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

	scrollToBottom(args?: { force?: boolean; update?: boolean; instant?: boolean }) {
		const { force, update, instant } = args || {}

		if (force) {
			this.forceToBottom()
		} else {
			scroll(this.ref_bottom_signal, { block: 'start', behavior: instant ? 'instant' : 'smooth' })
		}

		if (!update && !this.auto_scroll) this.auto_scroll = true
	}

	onWheel() {
		if (!this.wheeled) this.wheeled = true

		if (!this.auto_scroll) return

		this.auto_scroll = false
	}

	update() {
		this.chat_signal += 1

		if (this.auto_scroll) this.scrollToBottom({ update: true, instant: true })
	}

	async clear() {
		const res = await alert({
			title: 'Clear Messages',
			desc: 'Confirm clearing all message history?'
		})

		if (!res) return

		this.stop()

		this.chat.clearMessages()

		this.messages = []

		this.update()

		rpc.session.clear.mutate(this.id)
	}

	onScroll() {
		if (!this.ref_container) return
		if (this.status === 'streaming') return

		const { scrollTop, scrollHeight, clientHeight } = this.ref_container
		const is_at_top = scrollTop <= 600
		const is_at_bottom = scrollTop + clientHeight >= scrollHeight - 600

		if (is_at_top && this.has_older) {
			rpc.session.load.query({ id: this.id, type: 'prev' })
		}

		if (is_at_bottom && this.has_newer) {
			rpc.session.load.query({ id: this.id, type: 'next' })
		}
	}

	on() {
		const off_status = this.chat['~registerStatusCallback'](() => {
			this.status = this.chat.status

			this.update()
		})

		const off_messages = this.chat['~registerMessagesCallback'](() => {
			this.messages = $copy(this.chat.messages)

			this.update()
		}, 30)

		const off_error = this.chat['~registerErrorCallback'](() => {
			if (this.chat.error?.message) toast.error(this.chat.error.message, { duration: 1000000 })
		})

		this.util.acts.push(off_status, off_messages, off_error)
	}

	deinit() {
		this.util.deinit()
	}
}
