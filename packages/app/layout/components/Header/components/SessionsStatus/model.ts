import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { RPCOutput } from '@/types'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'

type StatusType = keyof RPCOutput['session']['getStatusList']
type SessionStatusData = RPCOutput['session']['getStatusList']

@injectable()
export default class Index {
	open = false
	active_status = 'running' as StatusType
	selected_session_id = ''
	data = {
		running: [],
		unread: [],
		error: []
	} as SessionStatusData

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		await this.refresh()

		this.syncSelectedSession()
	}

	async refresh() {
		this.data = await rpc.session.getStatusList.query()

		this.syncSelectedSession()
	}

	setOpen(open: boolean) {
		this.open = open
	}

	setActiveStatus(active_status: StatusType) {
		this.active_status = active_status

		this.syncSelectedSession()
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	async updateByStatus(status_map: SessionStatusPayload) {
		void status_map

		await this.refresh()
	}

	private syncSelectedSession() {
		const current_list = this.data[this.active_status]

		if (current_list.find(item => item.id === this.selected_session_id)) {
			return
		}

		const fallback_session = this.data.running[0] ?? this.data.unread[0] ?? this.data.error[0] ?? null

		if (current_list[0]) {
			this.selected_session_id = current_list[0].id

			return
		}

		this.selected_session_id = fallback_session?.id ?? ''

		if (!current_list.length) {
			if (this.data.running.length) {
				this.active_status = 'running'
			} else if (this.data.unread.length) {
				this.active_status = 'unread'
			} else if (this.data.error.length) {
				this.active_status = 'error'
			}
		}
	}
}
