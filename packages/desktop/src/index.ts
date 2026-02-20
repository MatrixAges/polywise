import '@desktop/utils/locale'
import '@desktop/utils/entry'

import { app, BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { createIPCHandler } from 'erpc/main'

import config from '../config'
import { Main, Menu, Tray } from './app'
import { routers } from './rpcs'
import { conf, getAppDataPath, getThemeColor, is_mac, registerProtocol, serve, show_devtool } from './utils'
import saveWithUtilityProcess from './utils/saveWithUtilityProcess'

import type { Tray as TrayType } from 'electron'

const port = await serve()

conf.set('serve_port', port)

class App {
	private window: BrowserWindow | null
	private loading_view: WebContentsView | null
	private tray: TrayType | null
	private memory_data_dir: string

	constructor() {
		this.window = null
		this.loading_view = null
		this.tray = null
		this.memory_data_dir = getAppDataPath('/memory')
	}

	async init() {
		this.register()
	}

	register() {
		app.whenReady().then(async () => {
			registerProtocol()

			console.log('[memory-bootstrap] init_start')

			try {
				await saveWithUtilityProcess.init(this.memory_data_dir)
				console.log('[memory-bootstrap] init_done')
			} catch (error) {
				const error_message = error instanceof Error ? error.message : String(error)

				console.log('[memory-bootstrap] init_error', { error_message })
			}

			this.window = new Main()
			this.loading_view = new WebContentsView()
			this.tray = new Tray(this.window).get()

			const win_bounds = conf.get('win_bounds')

			if (win_bounds) this.window.setBounds(win_bounds)

			this.loading()
			this.events(port)

			if (show_devtool) {
				if (process.platform === 'win32') {
					const win_devtools = new BrowserWindow()
					this.window.webContents.setDevToolsWebContents(win_devtools.webContents)
				}

				this.window.webContents.openDevTools({ mode: 'detach' })
			}

			createIPCHandler({
				createContext: async () => ({
					win: this.window!,
					tray: this.tray!,
					memory: {
						save: async input => {
							return await saveWithUtilityProcess.save(input, this.memory_data_dir)
						},
						query: async input => {
							return await saveWithUtilityProcess.query(input, this.memory_data_dir)
						},
						update: async input => {
							return await saveWithUtilityProcess.update(input, this.memory_data_dir)
						},
						forget: async input => {
							return await saveWithUtilityProcess.forget(input, this.memory_data_dir)
						},
						snapshot: async input => {
							return await saveWithUtilityProcess.snapshot(input, this.memory_data_dir)
						},
						getNodes: async () => {
							return await saveWithUtilityProcess.getNodes(this.memory_data_dir)
						},
						getNodesByIdol: async input => {
							return await saveWithUtilityProcess.getNodesByIdol(
								input,
								this.memory_data_dir
							)
						},
						getEdgesByIdol: async input => {
							return await saveWithUtilityProcess.getEdgesByIdol(
								input,
								this.memory_data_dir
							)
						}
					}
				}),
				router: routers,
				windows: [this.window]
			})
		})

		app.on('before-quit', async () => {
			this.tray?.destroy()
			this.window?.destroy()

			this.off()
		})

		if (is_mac) this.macOSHandler()
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

	events(port: number) {
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
