import { DefaultChatTransport } from 'ai'
import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { getId } from 'stk/utils'
import { injectable } from 'tsyringe'

import { server_sys_session_url } from '@/appdata'
import { Util } from '@/models/common'
import { alert, Chat, rpc } from '@/utils'

import type { Session } from '@core/db'
import type { Message } from '@core/fst'
import type { AbstractChat, UIMessage } from 'ai'

@injectable()
export default class Index {
	id = ''
	ref_container = null as unknown as HTMLDivElement

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
	}

	initChat() {
		if (!this.chat) {
			this.chat = new Chat({
				id: this.id,
				throttle: 60,
				transport: new DefaultChatTransport({
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
							const { session, messages } = res.data

							this.session = session as Session
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
	}

	stop() {
		if (this.status !== 'streaming') return

		this.chat.stop()

		rpc.session.stop.mutate(this.id)
	}

	update() {
		this.chat_signal += 1
	}

	async clear() {
		const res = await alert({
			title: 'Clear Messages',
			desc: 'Confirm clearing all message history?'
		})

		if (!res) return

		this.stop()

		this.messages = []

		this.update()

		rpc.session.clear.mutate(this.id)
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
