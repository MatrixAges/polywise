import { makeAutoObservable } from 'mobx'
import { setStoreWhenChange } from 'stk/mobx'
import { local } from 'stk/storage'
import { injectable } from 'tsyringe'

import { PANEL_WIDTH_DEFAULT } from '@/appdata'
import { Util } from '@/models/common'
import { getCssVar, setCssVar } from '@/utils'

import type { PanelImperativeHandle } from 'react-resizable-panels'

@injectable()
export default class Index {
	panel_ref = null as unknown as PanelImperativeHandle
	panel_collapsed = false
	sidebar_collapsed = false
	dev_theme = local.dev_theme || getCssVar('--dev-theme') === '1'

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false, panel_ref: false }, { autoBind: true })
	}

	async init() {
		const deinit = await setStoreWhenChange(['panel_collapsed', 'sidebar_collapsed', 'dev_theme'], this)

		this.setDevTheme(this.dev_theme)

		this.util.acts = [deinit]
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

	setDevTheme(v: boolean) {
		this.dev_theme = v

		setCssVar('--dev-theme', v ? '1' : '0')
	}

	deinit() {
		this.util.deinit()
	}
}
