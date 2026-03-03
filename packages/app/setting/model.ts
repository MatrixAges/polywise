import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class Index {
	current = 'general'

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {}

	setCurrent(v: Index['current']) {
		this.current = v
	}

	deinit() {}
}
