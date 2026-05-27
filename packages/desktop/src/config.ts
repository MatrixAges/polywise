import { getAppPath, getPath, is_dev, show_devtool } from '@desktop/utils'
import { nativeTheme } from 'electron'

import { productName } from '../package.json'

import type { BrowserWindowConstructorOptions } from 'electron'

nativeTheme.themeSource = 'dark'

export const window_options = {
	frame: false,
	fullscreen: false,
	autoHideMenuBar: true,
	titleBarStyle: 'hidden',
	width: 1080,
	height: 720,
	minWidth: 720,
	minHeight: 510,
	transparent: true,
	visualEffectState: 'active',
	vibrancy: 'under-window',
	backgroundMaterial: 'tabbed',
	trafficLightPosition: { x: 10, y: 14 },
	webPreferences: {
		sandbox: false,
		enableWebSQL: false,
		spellcheck: false,
		preload: getPath('dist/preload.js'),
		devTools: show_devtool
	}
} as BrowserWindowConstructorOptions

export default {
	window_options: {
		title: productName,
		icon: getPath('public/icon.ico'),
		...window_options
	} as BrowserWindowConstructorOptions,
	window_url: is_dev ? 'http://localhost:3071' : `file://${getAppPath('index.html')}`,
	loading_url: `file://${getPath('public/loading.html')}`,
	dock_icon_path: getPath('public/icons/icon.png'),
	getTrayIcon: () => getPath(`public/tray/tray.png`)
}
