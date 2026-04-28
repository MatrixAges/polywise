import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Project, Session } from '@core/db'

@injectable()
export default class Index {
	selected_project_id = ''
	selected_session_id = ''
	projects = [] as Array<{ project: Project; sessions: Array<Session>; has_more: boolean }>

	constructor(public util: Util) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {
		this.getProjectList()
	}

	async getProjectList() {
		const data = (await rpc.project.getList.query()) as Index['projects']

		this.projects = data
	}

	setSelectedProject(project_id: string) {
		this.selected_project_id = project_id
	}

	setSelectedSession(session_id: string) {
		this.selected_session_id = session_id
	}

	async createProject() {}

	async renameProject(project_item: Project) {}

	async removeProject(project_item: Project) {}

	async createSession(project_id: string) {
		await rpc.session.create.mutate({ project_id })

		await this.getProjectList()
	}

	async renameSession(args: { project_id: string; session_id: string; title: string }) {}

	async removeSession(args: { project_id: string; session_id: string }) {}

	deinit() {
		this.util.deinit()
	}
}
