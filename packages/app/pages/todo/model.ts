import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class Index {
	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}
