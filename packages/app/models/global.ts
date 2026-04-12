import { makeAutoObservable } from 'mobx'
import { Idle } from 'stk/utils'
import { singleton } from 'tsyringe'

import { Locale, Setting, Theme } from '@/models'
import { Util } from '@/models/common'
import { ipc, is_electron, rpc } from '@/utils'

@singleton()
export default class GlobalModel {
	ready = false
	disconnected = false
	idle = new Idle()

	constructor(
		public util: Util,
		public locale: Locale,
		public theme: Theme,
		public setting: Setting
	) {
		makeAutoObservable(
			this,
			{ util: false, locale: false, theme: false, setting: false, idle: false },
			{ autoBind: true }
		)
	}

	async init() {
		await this.locale.init()
		await this.theme.init()
		await this.setting.init()

		this.ready = true

		if (is_electron) this.onElectronMain()

		this.onHeartBeat()
		this.onUserIdle()
	}

	onElectronMain() {
		const deinit = ipc.app.onMain.subscribe(undefined, {
			onData: res => console.log(`[Electron main] ${res}`)
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	onHeartBeat() {
		const startTimer = () => setTimeout(() => (this.disconnected = true), 9 * 1000)

		let timer = startTimer()

		const deinit = rpc.heartbeat.subscribe(undefined, {
			onData: () => {
				clearTimeout(timer)

				timer = startTimer()
			}
		})

		this.util.acts.push(deinit.unsubscribe, () => clearTimeout(timer))
	}

	onUserIdle() {
		this.idle.init(90000, {
			onIdle: () => {
				rpc.setActive.mutate({ active: false })
			},
			onActive: () => {
				rpc.setActive.mutate({ active: true })
			}
		})

		this.util.acts.push(() => this.idle.off())
	}

	deinit() {
		this.util.deinit()
		this.locale.deinit()
		this.theme.deinit()
		this.setting.deinit()
	}
}
