import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStoreWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Session } from '@core/db'
import type { UIEvent } from 'react'
import type {
	IArgsMoveSessionOutGroup,
	IArgsMoveSessionToGroup,
	IArgsSortGroupSession,
	IArgsStartRenameGroup,
	IArgsStartRenameSession,
	ISessionMenuData,
	ISessionMenuGroup
} from './types'

@injectable()
export default class Index {
	current_tab = 'session' as 'session' | 'group'
	groups = [] as Array<ISessionMenuGroup>
	sessions = [] as Array<Session>
	pin_map = {} as Record<string, number>
	selected_session_id = ''
	rename_group_index = -1
	rename_session_id = ''
	rename_value = ''
	page = 1
	loading = false
	loading_more = false
	has_more = true
	temp_input = ''

	constructor(public util: Util) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		const deinit = await setStoreWhenChange(['current_tab', 'selected_session_id'], this)

		this.util.acts = [deinit]

		await this.refresh()

		this.watchSessionStatus()
	}

	async refresh() {
		this.loading = true

		try {
			const res = (await rpc.session.getList.query()) as ISessionMenuData

			this.groups = res.groups
			this.sessions = res.sessions
			this.pin_map = res.pin_map
			this.page = 1
			this.has_more = res.has_more

			const session_id_list = this.groups
				.flatMap(item => item.items.map(session_item => session_item.id))
				.concat(this.sessions.map(item => item.id))

			if (this.selected_session_id && !session_id_list.includes(this.selected_session_id)) {
				this.selected_session_id = ''
			}
		} finally {
			this.loading = false
		}
	}

	setCurrentTab(v: Index['current_tab']) {
		this.current_tab = v
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	setRenameValue(value: string) {
		this.rename_value = value
	}

	startRenameGroup(args: IArgsStartRenameGroup) {
		const { group_index, value } = args

		this.rename_group_index = group_index
		this.rename_session_id = ''
		this.rename_value = value
	}

	startRenameSession(args: IArgsStartRenameSession) {
		const { id, value } = args

		this.rename_group_index = -1
		this.rename_session_id = id
		this.rename_value = value
	}

	cancelRename() {
		this.rename_group_index = -1
		this.rename_session_id = ''
		this.rename_value = ''
	}

	async submitRename() {
		const rename_value = this.rename_value.trim()

		if (!rename_value) {
			this.cancelRename()

			return
		}

		if (this.rename_session_id) {
			await rpc.session.rename.mutate({ id: this.rename_session_id, title: rename_value })
		}

		if (this.rename_group_index >= 0) {
			await rpc.session.renameGroup.mutate({
				group_index: this.rename_group_index,
				name: rename_value
			})
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
		await rpc.session.remove.mutate({ id })

		if (this.selected_session_id === id) {
			this.selected_session_id = ''
		}

		if (this.rename_session_id === id) {
			this.cancelRename()
		}

		await this.refresh()
	}

	async togglePinSession(id: string) {
		await rpc.session.pin.mutate({ id, value: !this.pin_map[id] })

		await this.refresh()
	}

	async createGroup() {
		await rpc.session.createGroup.mutate({})

		await this.refresh()
	}

	async removeGroup(group_index: number) {
		await rpc.session.removeGroup.mutate({ group_index })

		if (this.rename_group_index === group_index) {
			this.cancelRename()
		}

		await this.refresh()
	}

	async sortGroup(from: number, to: number) {
		if (from === to) {
			return
		}

		if (to < 0 || to > this.groups.length - 1) {
			return
		}

		this.groups = arrayMove(this.groups, from, to)

		await rpc.session.sortGroup.mutate({ from, to })
		await this.refresh()
	}

	async sortGroupSession(args: IArgsSortGroupSession) {
		const { group_index, from, to } = args

		if (from === to) {
			return
		}

		const target_group = this.groups[group_index]

		if (!target_group) {
			return
		}

		if (to < 0 || to > target_group.items.length - 1) {
			return
		}

		this.groups = this.groups.map((item, index) => {
			if (index !== group_index) {
				return item
			}

			return {
				...item,
				items: arrayMove(item.items, from, to)
			}
		})

		await rpc.session.sortGroupSession.mutate({ group_index, from, to })
		await this.refresh()
	}

	async moveSessionToGroup(args: IArgsMoveSessionToGroup) {
		const { id, group_index } = args

		await rpc.session.moveToGroup.mutate({ id, group_index })
		await this.refresh()
	}

	async moveSessionOutGroup(args: IArgsMoveSessionOutGroup) {
		const { id, group_index } = args

		await rpc.session.moveOutGroup.mutate({ id, group_index })
		await this.refresh()
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: res => {
				const entries = Object.entries(res)

				if (!entries.length) {
					return
				}

				this.groups = this.groups.map(group_item => ({
					...group_item,
					items: group_item.items.map(session_item => {
						const status = res[session_item.id]

						if (status) {
							return {
								...session_item,
								title: status.title,
								is_runing: status.running,
								unread: status.unread
							}
						}

						return session_item
					})
				}))

				this.sessions = this.sessions.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							is_runing: status.running,
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
