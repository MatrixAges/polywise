import { autoUpdater } from 'electron-updater'

import { is_dev, p } from '@desktop/utils'

export default p.query(async () => {
	if (is_dev) return

	autoUpdater.checkForUpdates()
})
