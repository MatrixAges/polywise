import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Session } from '@core/db'
import type { ISessionMenuData, ISessionMenuGroup } from './types'

@injectable()
export default class Index {
	groups = [] as Array<ISessionMenuGroup>
	sessions = [] as Array<Session>
	selected_session_id = ''
	page = 1
	loading = false
	loading_more = false
	has_more = true

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		this.loading = true

		const res = (await rpc.session.getList.query()) as ISessionMenuData

		console.log(res)

		this.groups = res.groups
		this.sessions = res.sessions
		this.has_more = res.sessions.length >= 10

		const first_group_session = res.groups[0]?.items[0]
		const first_session = res.sessions[0]

		this.selected_session_id = first_group_session?.id || first_session?.id || ''
		this.loading = false
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
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

	deinit() {}
}
