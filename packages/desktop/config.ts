import { platform } from 'process'

import { conf, getAppPath, getPath, is_dev, show_devtool } from '@desktop/utils'

import { productName } from './package.json'

import type { BrowserWindowConstructorOptions } from 'electron'

export const window_options = {
	frame: false,
	fullscreen: false,
	autoHideMenuBar: true,
	titleBarStyle: 'hidden',
	width: 1080,
	height: 720,
	minWidth: 720,
	minHeight: 510,
	backgroundColor: 'white',
	// transparent: true,
	// visualEffectState: 'active',
	trafficLightPosition: { x: 10, y: 10 },
	webPreferences: {
		sandbox: false,
		enableWebSQL: false,
		spellcheck: false,
		preload: getPath('dist/preload.js'),
		devTools: show_devtool
	}
} as BrowserWindowConstructorOptions

const glass = conf.get('glass')

if (glass || glass === undefined) {
	switch (platform) {
		case 'darwin':
			window_options['vibrancy'] = 'under-window'

			break

		case 'win32':
			window_options['backgroundMaterial'] = 'tabbed'
			break
	}
}

export default {
	window_options: {
		title: productName,
		icon: getPath('public/icon.ico'),
		...window_options
	} as BrowserWindowConstructorOptions,
	window_url: is_dev ? 'http://localhost:666' : `file://${getAppPath('index.html')}`,
	loading_url: `file://${getPath('public/loading.html')}`,
	dock_icon_path: getPath('public/icons/icon.png'),
	getTrayIcon: () => getPath(`public/tray/tray.png`)
}
