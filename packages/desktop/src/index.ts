import '@desktop/utils/locale'
import '@desktop/utils/entry'

import path from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, WebContentsView } from 'electron'
import { createIPCHandler } from 'erpc/main'
import { Polywise } from 'polywise'

import config from '../config'
import { Main, Menu, Tray } from './app'
import { routers } from './rpcs'
import { conf, getThemeColor, is_mac, main_emitter, registerProtocol, serve } from './utils'

import type { Tray as TrayType } from 'electron'

const port = await serve()

conf.set('serve_port', port)

class App {
	private window: BrowserWindow | null
	private loading_view: WebContentsView | null
	private tray: TrayType | null
	private poly: Polywise | null

	constructor() {
		this.window = null
		this.loading_view = null
		this.tray = null
		this.poly = null
	}

	async init() {
		this.register()
	}

	register() {
		app.whenReady().then(async () => {
			registerProtocol()

			this.window = new Main()
			this.loading_view = new WebContentsView()
			this.tray = new Tray(this.window).get()

			const win_bounds = conf.get('win_bounds')

			if (win_bounds) this.window.setBounds(win_bounds)

			this.loading()
			this.events()

			this.window.webContents.openDevTools({ mode: 'detach' })

			createIPCHandler({
				createContext: async () => ({ win: this.window!, tray: this.tray! }),
				router: routers,
				windows: [this.window]
			})

			setTimeout(() => {
				this.test()
			}, 3000)
		})

		app.on('before-quit', async () => {
			this.tray?.destroy()
			this.window?.destroy()

			if (this.poly) {
				await this.poly.off()
			}

			this.off()
		})

		if (is_mac) this.macOSHandler()
	}

	async test() {
		try {
			const data_dir = path.join(app.getPath('userData'), 'polywise-db')

			console.log('Initializing Polywise at:', data_dir)
			main_emitter.emit('CHANGE', 'Initializing Polywise at:' + data_dir)

			this.poly = new Polywise()

			await this.poly.init({
				data_dir
			})

			console.log('Polywise initialized successfully')
			main_emitter.emit('CHANGE', 'Polywise initialized successfully')

			await this.poly.article.process({
				content: 'Polywise is running inside Electron! This is a test article.'
			})

			const results = await this.poly.article.searchByText({ query: 'Electron' })

			console.log('Search results:', results)
			main_emitter.emit('CHANGE', 'Search results:' + JSON.stringify(results))
		} catch (error) {
			console.error('Failed to initialize Polywise:', error)
			main_emitter.emit('CHANGE', 'Polywise Error' + String(error))

			dialog.showErrorBox('Polywise Error', String(error))
		}
	}

	loading() {
		const window = this.window!
		const loading_view = this.loading_view!
		const { width, height } = window.getBounds()

		window.setResizable(false)
		window.contentView.addChildView(loading_view)

		loading_view.setBounds({ x: 0, y: 0, width, height })
		loading_view.webContents.loadURL(config.loading_url)

		loading_view.webContents.executeJavaScript(
			`document.documentElement.setAttribute("data-theme", "${getThemeColor()}")`
		)

		loading_view.webContents.on('dom-ready', () => {
			window.show()
		})
	}

	events() {
		ipcMain.handle('get-env', () => {
			return { port }
		})

		ipcMain.on('stop-loading', () => {
			this.removeLoading()
			this.window!.setResizable(true)
		})
	}

	macOSHandler() {
		app.dock!.setIcon(config.dock_icon_path)

		app.on('activate', () => {
			this.window?.show()
		})
	}

	removeLoading() {
		const window = this.window!
		const loading_view = this.loading_view!

		window.contentView.removeChildView(loading_view)
	}

	off() {
		this.window = null
	}
}

if (process.platform === 'darwin') {
	Menu()
}

new App().init()
