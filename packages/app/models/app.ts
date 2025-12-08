import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'
import { Util } from './common'

import type Recall from '@desktop/recall'

@injectable()
export default class Index {
	constructor(public util: Util) {
		makeAutoObservable(this, { chat_messages: false, submit: false }, { autoBind: true })
	}

	init() {}

	off() {
		this.util.off()
	}
}
