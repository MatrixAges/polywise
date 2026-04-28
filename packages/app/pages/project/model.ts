import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Project, Session } from '@core/db'

@injectable()
export default class Index {
	session_id = ''
	projects = [] as Array<{ project: Project; sessions: Array<Session>; has_more: boolean }>

	constructor(public util: Util) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {
		this.getProjectList()
	}

	async getProjectList() {
		const data = (await rpc.project.getList.query()) as unknown as Index['projects']

		this.projects = data
	}

	deinit() {
		this.util.deinit()
	}
}
