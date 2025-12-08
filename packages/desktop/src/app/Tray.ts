import { app, BrowserWindow, Menu, Tray } from 'electron'
import { t } from 'i18next'

import config from '../../config'

import type { Tray as ITray } from 'electron'

export default class Index {
	private window: BrowserWindow | null
	private tray = null as unknown as ITray

	constructor(window: BrowserWindow) {
		this.window = window || null

		this.init()
	}

	getMenu() {
		const win = this.window!

		const visible = win.isVisible()

		return Menu.buildFromTemplate([
			{
				label: visible ? t('global.close') : t('global.show'),
				click: () => (visible ? win.close() : win.show())
			},
			{
				label: t('global.quit'),
				click: () => app.quit()
			}
		])
	}

	init() {
		const win = this.window!

		this.tray = new Tray(config.getTrayIcon())

		this.tray.setToolTip(app.name)

		this.tray.on('click', async () => {
			win.isVisible() ? win.close() : win.show()
		})

		this.tray.on('right-click', () => {
			this.tray!.popUpContextMenu(this.getMenu())
		})
	}

	get() {
		return this.tray
	}
}
