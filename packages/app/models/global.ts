import { makeAutoObservable } from 'mobx'
import { singleton } from 'tsyringe'

import { Memory, Settings } from '@/models'
import { Util } from '@/models/common'
import { ipc } from '@/utils'

@singleton()
export default class GlobalModel {
	constructor(
		public util: Util,
		public settings: Settings,
		public memory: Memory
	) {
		makeAutoObservable(this, { util: false, settings: false, memory: false }, { autoBind: true })

		this.onMain()
	}

	onMain() {
		const off = ipc.app.onMain.subscribe(undefined, {
			onData: res => {
				console.log(res)
			}
		})

		this.util.acts.push(off.unsubscribe)
	}

	init() {
		this.settings.init()
		this.memory.init()
	}

	off() {
		this.settings.off()
		this.memory.off()
	}
}
