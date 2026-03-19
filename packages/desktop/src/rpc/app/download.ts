import { p } from '@desktop/utils'
import { autoUpdater } from 'electron-updater'

export default p.query(async () => {
	autoUpdater.downloadUpdate()
})
