import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCOutput } from '@/types'
import type { SessionStatusType } from '@core/rpc/session/types'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'

type SessionStatusCount = { unread: number; running: number; error: number }
type SessionStatusList = RPCOutput['session']['getStatusList']

@injectable()
export default class Index {
	count = {} as SessionStatusCount
	open = false
	current_status = 'unread' as SessionStatusType
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

	setCurrentStatus(v: string) {
		this.current_status = v as SessionStatusType

		this.getStatusList()
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	patchSessionStatus(item: SessionStatusList[number], status_map: SessionStatusPayload) {
		const status = status_map[item.id]

		if (!status) return item

		return { ...item, ...status } as SessionStatusList[number]
	}

	async getStatusList() {
		this.list = await rpc.session.getStatusList.query({ status: this.current_status })
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
			onData: res => {
				if (!this.open) return

				this.list = this.list.map(item => this.patchSessionStatus(item, res))
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
