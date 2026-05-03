import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCOutput } from '@/types'

@injectable()
export default class Index {
	type = 'inbox'
	menu_data = {} as RPCOutput['todo']['getMenuData']
	kanban_data = {} as RPCOutput['todo']['query']

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	init() {
		const deinit = setStorageWhenChange([], this)

		this.util.acts = [deinit]

		this.getProjects()
		this.getTodos()
	}

	setType(v: string) {
		this.type = v

		this.getTodos()
	}

	async getProjects() {
		this.menu_data = await rpc.todo.getMenuData.query()
	}

	async getTodos() {
		this.kanban_data = await rpc.todo.query.query({ type: this.type })

		console.log($copy(this.kanban_data))
	}

	deinit() {
		this.util.deinit()
	}
}
