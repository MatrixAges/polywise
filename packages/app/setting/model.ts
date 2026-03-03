import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class Index {
	active = 'general'

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {}

	deinit() {}
}
