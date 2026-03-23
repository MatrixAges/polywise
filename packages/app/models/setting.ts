import { makeAutoObservable } from 'mobx'
import { setStoreWhenChange } from 'stk/mobx'
import { local } from 'stk/storage'
import { injectable } from 'tsyringe'

import { PANEL_WIDTH_DEFAULT } from '@/appdata'
import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { AppConfig, ProviderConfig } from '@core/types'
import type { PanelImperativeHandle } from 'react-resizable-panels'

@injectable()
export default class Index {
	panel_ref = null as unknown as PanelImperativeHandle
	panel_collapsed = false
	sidebar_collapsed = false

	config = null as unknown as AppConfig
	providers = null as unknown as ProviderConfig

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false, panel_ref: false }, { autoBind: true })
	}

	async init() {
		const deinit = await setStoreWhenChange(['panel_collapsed', 'sidebar_collapsed'], this)

		this.util.acts = [deinit]

		this.watchConfig()
	}

	watchConfig() {
		const deinit = rpc.file.watch.subscribe(['config', 'providers'], {
			onData: res => {
				if (res['config']) {
					this.config = res['config']
				}

				if (res['providers']) {
					this.providers = res['providers']
				}
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	setConfig(type: 'config' | 'providers', data: any) {
		rpc.file.write.mutate({ path: `${type}.json`, data })
	}

	setPanelRef(v: Index['panel_ref']) {
		this.panel_ref = v
	}

	togglePanel() {
		if (this.panel_ref.isCollapsed()) {
			const last_width = local.layout_panel_last_width as number

			if (last_width) {
				this.panel_ref.resize(last_width.toString())
			} else {
				this.panel_ref.expand()
			}
		} else {
			this.panel_ref.collapse()
		}

		this.panel_collapsed = this.panel_ref.isCollapsed()
	}

	resetPanal() {
		this.panel_ref.resize(PANEL_WIDTH_DEFAULT)
	}

	updatePanelState() {
		this.panel_collapsed = this.panel_ref.isCollapsed()
	}

	toggleSidebar() {
		this.sidebar_collapsed = !this.sidebar_collapsed
	}

	deinit() {
		this.util.deinit()
	}
}
