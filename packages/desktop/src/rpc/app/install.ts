import { p } from '@desktop/utils'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

export default p.query(async ({ ctx }) => {
	setImmediate(() => {
		app.removeAllListeners('window-all-closed')
		ctx.win.destroy()
		autoUpdater.quitAndInstall()
	})
})
