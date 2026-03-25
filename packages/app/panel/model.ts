import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class Index {
	active_tab = 'session'

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	setActiveTab(v: Index['active_tab']) {
		this.active_tab = v
	}
}
