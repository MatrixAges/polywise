import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

import { p } from '@desktop/utils'

export default p.query(async ({ ctx }) => {
	setImmediate(() => {
		app.removeAllListeners('window-all-closed')
		ctx.win.destroy()
		autoUpdater.quitAndInstall()
	})
})
