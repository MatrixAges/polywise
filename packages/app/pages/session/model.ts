import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Session } from '@core/db'
import type { UIEvent } from 'react'
import type { IArgsStartRenameSession, ISessionMenuData } from './types'

@injectable()
export default class Index {
	pins = [] as Array<Session>
	sessions = [] as Array<Session>
	pin_map = {} as Record<string, number>
	selected_session_id = ''
	rename_pin = false
	rename_session_index = -1
	rename_value = ''
	page = 1
	loading = false
	loading_more = false
	has_more = true
	temp_input = ''

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		const deinit = setStorageWhenChange(['selected_session_id'], this)

		this.util.acts = [deinit]

		await this.refresh()

		this.watchSessionStatus()
	}

	async refresh() {
		this.loading = true

		try {
			const res = (await rpc.session.getList.query()) as ISessionMenuData

			this.pins = res.pins
			this.sessions = res.sessions
			this.pin_map = res.pin_map
			this.page = 1
			this.has_more = res.has_more

			const session_id_list = this.pins.map(item => item.id).concat(this.sessions.map(item => item.id))

			if (this.selected_session_id && !session_id_list.includes(this.selected_session_id)) {
				this.selected_session_id = ''
			}
		} finally {
			this.loading = false
		}
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	setRenameValue(value: string) {
		this.rename_value = value
	}

	startRenameSession(args: IArgsStartRenameSession) {
		const { pin, session_index, value } = args

		this.rename_pin = pin
		this.rename_session_index = session_index
		this.rename_value = value
	}

	cancelRename() {
		this.rename_pin = false
		this.rename_session_index = -1
		this.rename_value = ''
	}

	async submitRename() {
		const rename_value = this.rename_value.trim()

		if (!rename_value) {
			this.cancelRename()

			return
		}

		if (this.rename_session_index >= 0) {
			const target_list = this.rename_pin ? this.pins : this.sessions
			const target_session = target_list[this.rename_session_index]

			if (target_session) {
				const session_id = target_session.id
				const next_sessions = [...target_list]

				next_sessions[this.rename_session_index] = {
					...target_session,
					title: rename_value
				}

				if (this.rename_pin) {
					this.pins = next_sessions
				} else {
					this.sessions = next_sessions
				}

				await rpc.session.rename.mutate({ id: session_id, title: rename_value })
			}
		}

		this.cancelRename()

		await this.refresh()
	}

	onScroll(event: UIEvent<HTMLDivElement>) {
		const target = event.currentTarget
		const is_near_bottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24

		if (is_near_bottom) {
			this.loadMore()
		}
	}

	async loadMore() {
		if (this.loading) return
		if (this.loading_more) return
		if (!this.has_more) return

		this.loading_more = true

		try {
			const res = (await rpc.session.getMoreList.query({ page: this.page })) as Array<Session>

			this.sessions = [...this.sessions, ...res]
			this.page += 1
			this.has_more = res.length >= 10
		} finally {
			this.loading_more = false
		}
	}

	async createSession(input?: string) {
		const input_text = typeof input === 'string' ? input : ''
		const next_session = await rpc.session.create.mutate({})

		if (!next_session) return

		await this.refresh()

		this.selected_session_id = next_session.id

		if (input_text) {
			this.temp_input = input_text

			setTimeout(() => {
				this.temp_input = ''
			}, 1200)
		}
	}

	async removeSession(id: string) {
		let renaming_session_id = ''

		if (this.rename_session_index >= 0) {
			if (this.rename_pin) {
				renaming_session_id = this.pins[this.rename_session_index]?.id || ''
			} else {
				renaming_session_id = this.sessions[this.rename_session_index]?.id || ''
			}
		}

		await rpc.session.remove.mutate({ id })

		if (this.selected_session_id === id) {
			this.selected_session_id = ''
		}

		if (renaming_session_id && renaming_session_id === id) {
			this.cancelRename()
		}

		await this.refresh()
	}

	async togglePinSession(id: string) {
		await rpc.session.pin.mutate({ id, value: !this.pin_map[id] })

		await this.refresh()
	}

	async sortPin(from: number, to: number) {
		if (from === to) {
			return
		}

		if (to < 0 || to > this.pins.length - 1) {
			return
		}

		this.pins = arrayMove(this.pins, from, to)

		await rpc.session.sortPin.mutate({ from, to })
		await this.refresh()
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: res => {
				if (!Object.keys(res).length) {
					return
				}

				this.sessions = this.sessions.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})

				this.pins = this.pins.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
