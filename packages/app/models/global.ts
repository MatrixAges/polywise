import { makeAutoObservable, reaction } from 'mobx'
import { toast } from 'sonner'
import { Idle } from 'stk/utils'
import { singleton } from 'tsyringe'

import { Auth, Locale, Setting, Theme } from '@/models'
import { Util } from '@/models/common'
import { ipc, is_electron, rpc } from '@/utils'

import type { DesktopUpdateEvent, UpdateState } from '@/types/app'

@singleton()
export default class GlobalModel {
	ready = false
	disconnected = false
	update_status = null as UpdateState
	update_version = ''
	idle = new Idle()

	constructor(
		public util: Util,
		public auth: Auth,
		public locale: Locale,
		public theme: Theme,
		public setting: Setting
	) {
		makeAutoObservable(
			this,
			{ util: false, auth: false, locale: false, theme: false, setting: false, idle: false },
			{ autoBind: true }
		)
	}

	async init() {
		if (is_electron) document.documentElement.setAttribute('data-electron', '1')

		await this.locale.init()
		await this.theme.init()
		await this.auth.init()

		if (this.canBootRuntime()) {
			await this.setting.init()
			this.watchAuthConfig()

			if (is_electron) {
				this.onElectronMain()
				this.onAppUpdate()
				this.checkUpdate()
			}

			this.onHeartBeat()
			this.onUserIdle()
		}

		this.ready = true
	}

	canBootRuntime() {
		return is_electron || this.auth.bootstrapRequired || !this.auth.requiresAuth || this.auth.authenticated
	}

	watchAuthConfig() {
		const dispose = reaction(
			() => this.setting.config?.auth?.enabled,
			async enabled => {
				if (enabled === undefined) {
					return
				}

				await this.auth.refreshStatus()
			}
		)

		this.util.acts.push(dispose)
	}

	onElectronMain() {
		const deinit = ipc.app.onMain.subscribe(undefined, {
			onData: res => {
				if (res.type === 'maximize') {
					this.setting.setMaximize(res.value)
					return
				}
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	onAppUpdate() {
		const deinit = ipc.app.onUpdate.subscribe(undefined, {
			onData: args => {
				this.handleUpdateEvent(args)
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	handleUpdateEvent(args: DesktopUpdateEvent) {
		switch (args.type) {
			case 'can_update':
				this.update_version = args.value
				this.update_status = { type: 'has_update', version: args.value }

				return
			case 'cant_update':
				this.update_version = ''
				this.update_status = null

				return
			case 'progress':
				this.update_status = { type: 'downloading', percent: this.normalizeUpdatePercent(args.value) }

				return
			case 'downloaded':
				this.update_status = { type: 'downloaded' }
				toast.info($t('app_update.restarting'))
				this.installUpdate()

				return
			case 'error':
				this.handleUpdateError(args.value)

				return
		}
	}

	checkUpdate() {
		void ipc.app.checkUpdate.query().catch(this.handleUnexpectedUpdateError)
	}

	downloadUpdate() {
		this.update_status = { type: 'downloading', percent: 0 }

		void ipc.app.download.query().catch(this.handleUnexpectedUpdateError)
	}

	installUpdate() {
		void ipc.app.install.query().catch(this.handleUnexpectedUpdateError)
	}

	handleUpdateError(message: string) {
		const next_message = message || $t('app_update.error')

		this.update_status = this.update_version
			? { type: 'has_update', version: this.update_version }
			: { type: 'error', message: next_message }

		toast.error(next_message)
	}

	handleUnexpectedUpdateError(error: unknown) {
		this.handleUpdateError(this.readUpdateError(error))
	}

	readUpdateError(error: unknown) {
		if (error instanceof Error && error.message) return error.message
		if (typeof error === 'string' && error) return error

		return $t('app_update.error')
	}

	normalizeUpdatePercent(value: number) {
		return Math.max(0, Math.min(100, Math.floor(value)))
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
		this.auth.deinit?.()
		this.locale.deinit()
		this.theme.deinit()
		this.setting.deinit()
	}
}
