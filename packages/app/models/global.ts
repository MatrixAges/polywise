import { singleton } from 'tsyringe'

import { Settings } from '@/models'

@singleton()
export default class GlobalModel {
	constructor(public settings: Settings) {}

	init() {
		this.settings.init()
	}

	off() {
		this.settings.off()
	}
}
