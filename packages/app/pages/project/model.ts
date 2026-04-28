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

	setSelectedProject(project_id: string) {}

	setSelectedSession(session_id: string) {}

	renameProject(project_item: Project) {}

	removeProject(project_item: Project) {}

	async createSession(args: { project_id: string; title?: string }) {}

	async renameSession(args: { project_id: string; session_id: string; title: string }) {}

	async removeSession(args: { project_id: string; session_id: string }) {}

	deinit() {
		this.util.deinit()
	}
}
