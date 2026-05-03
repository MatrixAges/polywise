import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Project } from '@core/db'

@injectable()
export default class Index {
	projects = [] as Array<Project>

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	init() {
		const deinit = setStorageWhenChange([], this)

		this.util.acts = [deinit]

		this.getProjects()
	}

	async getProjects() {
		this.projects = (await rpc.project.list.query()) as Array<Project>
	}

	deinit() {
		this.util.deinit()
	}
}
