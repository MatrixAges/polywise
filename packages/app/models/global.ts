import { makeAutoObservable } from 'mobx'
import { singleton } from 'tsyringe'

import { Setting } from '@/models'
import { Util } from '@/models/common'
import { ipc } from '@/utils'

@singleton()
export default class GlobalModel {
	constructor(
		public util: Util,
		public settings: Setting
	) {
		makeAutoObservable(this, { util: false, settings: false }, { autoBind: true })

		// this.onMain()
	}

	// onMain() {
	// 	const off = ipc.app.onMain.subscribe(undefined, {
	// 		onData: res => {
	// 			console.log(res)
	// 		}
	// 	})

	// 	this.util.acts.push(off.unsubscribe)
	// }

	init() {
		this.settings.init()
	}

	off() {
		this.settings.off()
	}
}
