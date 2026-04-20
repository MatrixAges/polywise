import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Session } from '@core/db'
import type { UIEvent } from 'react'
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

		try {
			const res = (await rpc.session.getList.query()) as ISessionMenuData

			this.groups = res.groups
			this.sessions = res.sessions
			this.selected_session_id = ''
			this.page = 1
			this.has_more = res.sessions.length >= 10
		} finally {
			this.loading = false
		}
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
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

	deinit() {}
}
