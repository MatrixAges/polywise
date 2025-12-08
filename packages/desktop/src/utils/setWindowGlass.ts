import type { BrowserWindow } from 'electron'

export default (win: BrowserWindow, v: boolean) => {
	if (process.platform === 'darwin') {
		win.setVibrancy(v ? 'under-window' : null)
	} else {
		win.setBackgroundMaterial(v ? 'tabbed' : 'auto')
	}
}
