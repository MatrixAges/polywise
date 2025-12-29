import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'
import { Util } from './common'

@injectable()
export default class Index {
	open = false

	constructor(public util: Util) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {}

	off() {
		this.util.off()
	}
}
