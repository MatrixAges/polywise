import { app, Menu } from 'electron'

const { setApplicationMenu, buildFromTemplate } = Menu

export default () => {
	setApplicationMenu(
		buildFromTemplate([
			{
				label: app.name,
				submenu: [
					{ role: 'about' },
					{ type: 'separator' },
					{ role: 'hide' },
					{ role: 'hideOthers' },
					{ role: 'unhide' },
					{ type: 'separator' },
					{ role: 'quit' }
				]
			},
			{
				label: 'Edit',
				submenu: [
					{ accelerator: 'CmdOrCtrl+C', role: 'copy' },
					{ accelerator: 'CmdOrCtrl+V', role: 'paste' },
					{ accelerator: 'CmdOrCtrl+X', role: 'cut' },
					{ accelerator: 'CmdOrCtrl+Z', role: 'undo' },
					{ accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
					{ accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
				]
			}
		])
	)
}
