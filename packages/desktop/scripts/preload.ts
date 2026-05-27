import { basename, extname } from 'path'
import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { exposeConf } from 'electron-conf/preload'
import { exposeElectronTRPC } from 'erpc/main'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

exposeConf()

contextBridge.exposeInMainWorld('$shell', {
	type: 'electron',
	platform: process.platform,
	stopLoading: () => {
		ipcRenderer.send('stop-loading')
	},
	getPathForFile: (file: File) => {
		const path = webUtils.getPathForFile(file)
		const base_name = basename(path)
		const ext_name = extname(base_name)

		return {
			name: basename(base_name, ext_name),
			path: path
		}
	}
})

process.once('loaded', () => {
	exposeElectronTRPC()
})
