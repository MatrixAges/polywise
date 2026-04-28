import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

@injectable()
export default class Index {
	session_id = ''

	constructor(public util: Util) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {
		this.getProjectList()
	}

	async getProjectList() {
		const data = await rpc.project.getList.query()

		console.log(data)
	}

	deinit() {
		this.util.deinit()
	}
}
