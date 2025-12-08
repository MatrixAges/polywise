import { autoUpdater } from 'electron-updater'

import { p } from '@desktop/utils'

export default p.query(async () => {
	autoUpdater.downloadUpdate()
})
