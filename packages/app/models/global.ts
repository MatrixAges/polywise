import to from 'await-to-js'
import { makeAutoObservable } from 'mobx'
import { singleton } from 'tsyringe'

import { Locale, Setting, Theme } from '@/models'
import { Util } from '@/models/common'
import { api, ipc, is_electron } from '@/utils'

@singleton()
export default class GlobalModel {
	ready = false
	disconnected = false

	constructor(
		public util: Util,
		public locale: Locale,
		public theme: Theme,
		public setting: Setting
	) {
		makeAutoObservable(this, { util: false, locale: false, theme: false, setting: false }, { autoBind: true })
	}

	async init() {
		await this.locale.init()
		await this.theme.init()
		await this.setting.init()

		this.ready = true

		if (is_electron) this.onElectronMain()

		this.onHeartBeat()
	}

	onElectronMain() {
		const deinit = ipc.app.onMain.subscribe(undefined, {
			onData: res => console.log(`[Electron main] ${res}`)
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	onHeartBeat() {
		setInterval(async () => {
			const [err, res] = await to(api.heartbeat.$get())

			if (err || !res.ok) return (this.disconnected = true)

			const data = await res.json()

			this.disconnected = data.status !== 'ok'
		}, 6000)
	}

	deinit() {
		this.util.deinit()
		this.locale.deinit()
		this.theme.deinit()
		this.setting.deinit()
	}
}
