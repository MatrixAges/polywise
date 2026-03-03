import { makeAutoObservable } from 'mobx'
import { singleton } from 'tsyringe'

import { Locale, Setting, Theme } from '@/models'
import { Util } from '@/models/common'
import { ipc, is_electron } from '@/utils'

@singleton()
export default class GlobalModel {
	constructor(
		public util: Util,
		public locale: Locale,
		public theme: Theme,
		public settings: Setting
	) {
		makeAutoObservable(this, { util: false, locale: false, theme: false, settings: false }, { autoBind: true })
	}

	init() {
		this.locale.init()
		this.theme.init()
		this.settings.init()

		if (is_electron) this.onElectronMain()
	}

	onElectronMain() {
		const deinit = ipc.app.onMain.subscribe(undefined, {
			onData: res => console.log(`[Electron main] ${res}`)
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
		this.locale.deinit()
		this.theme.deinit()
		this.settings.deinit()
	}
}
