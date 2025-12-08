import { BrowserWindow, shell } from 'electron'

import { conf } from '@desktop/utils'

import config from '../../config'

export default class Index extends BrowserWindow {
	private window: BrowserWindow | null

	constructor() {
		super(config.window_options)

		this.window = this

		this.loadURL(config.window_url)
		this.register()
	}

	register() {
		if (this.window === null) return

		const window = this.window

		window.on('close', e => {
			if (this.window === null) return

			if (this.window['hide'] && this.window['setSkipTaskbar']) {
				this.window.hide()

				e.preventDefault()
			}
		})

		window.on('closed', () => {
			this.window = null
		})

		window.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url)

			return { action: 'deny' }
		})

		window.webContents.on('will-navigate', (e, url) => {
			e.preventDefault()

			shell.openExternal(url)
		})

		window.on('moved', () => {
			conf.set('win_bounds', window.getBounds())
		})

		window.on('resized', () => {
			conf.set('win_bounds', window.getBounds())
		})

		window.on('show', () => {
			window.setSkipTaskbar(false)
		})

		window.on('close', () => {
			window.setSkipTaskbar(true)
		})
	}

	destory() {
		this.window = null
	}
}
