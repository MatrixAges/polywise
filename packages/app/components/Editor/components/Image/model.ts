import { makeAutoObservable } from 'mobx'

export default class Index {
	type = 'URL' as 'URL' | 'File'

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}
