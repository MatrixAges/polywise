import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Project, Session } from '@core/db'

@injectable()
export default class Index {
	selected_project_id = ''
	selected_session_id = ''
	rename_project_id = ''
	rename_session_id = ''
	rename_value = ''
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

	onRenameProject(project_id: string, title: string) {
		this.rename_project_id = project_id
		this.rename_value = title
	}

	onRenameSession(session_id: string, title: string) {
		this.rename_session_id = session_id
		this.rename_value = title
	}

	onChangeRenameValue(v: string) {
		this.rename_value = v
	}

	onCancelRename() {
		this.rename_session_id = ''
		this.rename_value = ''
	}

	async createProject() {}

	async renameProject(project_item: Project) {}

	async removeProject(project_item: Project) {}

	async createSession(project_id: string) {
		await rpc.session.create.mutate({ project_id })

		await this.getProjectList()
	}

	async renameSession() {
		if (!this.rename_value) return this.onCancelRename()

		await rpc.session.rename.mutate({ id: this.rename_session_id, title: this.rename_value })
	}

	async removeSession(session_id: string) {
		await rpc.session.remove.mutate({ id: session_id })

		await this.getProjectList()
	}

	deinit() {
		this.util.deinit()
	}
}
