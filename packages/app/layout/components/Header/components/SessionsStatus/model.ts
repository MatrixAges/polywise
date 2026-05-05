import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCOutput } from '@/types'
import type { SessionStatusType } from '@core/rpc/session/types'

type SessionStatusCount = { unread: number; running: number; error: number }
type SessionStatusList = RPCOutput['session']['getStatusList']

@injectable()
export default class Index {
	count = {} as SessionStatusCount
	open = false
	current_status = 'running' as SessionStatusType
	list = [] as SessionStatusList
	selected_session_id = ''

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		this.watchSessionCount()
		this.watchSessionStatus()
	}

	toggleOpen(v?: boolean) {
		this.open = v ?? !this.open

		if (this.open) this.getStatusList()
	}

	setCurrentStatus(v: Index['current_status']) {
		this.current_status = v
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	async getStatusList() {
		const next_list = await rpc.session.getStatusList.query({ status: this.current_status })

		this.list = next_list
	}

	watchSessionCount() {
		const deinit = rpc.session.getSessionStatus.subscribe(undefined, {
			onData: res => {
				this.count = res
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: async () => {
				if (this.open) this.getStatusList()
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
