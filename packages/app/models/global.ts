import { singleton } from 'tsyringe'

import { App } from '@/models'

@singleton()
export default class GlobalModel {
	constructor(public app: App) {}

	init() {
		this.app.init()
	}

	off() {
		this.app.off()
	}
}
