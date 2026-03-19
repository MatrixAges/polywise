import { is_dev, p } from '@desktop/utils'
import { autoUpdater } from 'electron-updater'

export default p.query(async () => {
	if (is_dev) return

	autoUpdater.checkForUpdates()
})
