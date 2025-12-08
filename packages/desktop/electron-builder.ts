import { platform } from 'os'

import { productName } from './package.json'

import type { Configuration } from 'electron-builder'

const { ZIP } = process.env
const OS = platform()

// const arch = ['x64', 'arm64']
const arch = ['x64']
const condition_config = {} as any
const condition_darwin = {} as any

if (OS === 'darwin') {
	// condition_config['afterSign'] = './dist/notarize.js'
	condition_config['dmg'] = { sign: false }

	condition_darwin['identity'] = null
	condition_darwin['hardenedRuntime'] = true
	condition_darwin['gatekeeperAssess'] = false
	condition_darwin['target'] = ZIP ? { target: 'zip', arch } : { target: 'dmg', arch }
}

if (OS === 'win32') {
	// condition_config['electronLanguages'] = ['en', 'zh-CN']
}

export default {
	...condition_config,
	productName,
	asar: true,
	compression: 'normal',
	directories: { output: (ZIP ? 'zip' : 'release') + '/${platform}/${arch}' },
	files: ['public/**/*', 'dist/**/*', '!dist/notarize.js'],
	extraResources: [{ from: '../app/dist', to: 'app_dist' }],
	artifactName: '${productName}-${version}-${arch}.${ext}',
	mac: {
		...condition_darwin,
		entitlements: './Entitlements.plist',
		icon: 'public/icons/icon.icns',
		extendInfo: {
			'com.apple.security.cs.allow-jit': true,
			'Bundle name': productName,
			ElectronTeamID: '84LQHT5G2Z',
			LSHasLocalizedDisplayName: true,
			ITSAppUsesNonExemptEncryption: 'NO'
		}
	},
	win: {
		target: [
			{
				target: 'nsis',
				arch: ['x64']
			}
		],
		icon: 'public/icons/icon.ico',
		compression: 'maximum'
	},
	nsis: {
		oneClick: false,
		perMachine: true,
		allowToChangeInstallationDirectory: true,
		deleteAppDataOnUninstall: true,
		createDesktopShortcut: true,
		createStartMenuShortcut: true,
		installerIcon: 'public/icons/icon.ico',
		uninstallerIcon: 'public/icons/icon.ico',
		installerHeader: 'public/icons/icon.ico',
		installerHeaderIcon: 'public/icons/icon.ico'
	},
	fileAssociations: [
		{
			name: productName,
			ext: 'elefile',
			icon: 'public/icons/icon.ico'
		}
	],
	publish: [
		{
			provider: 'generic',
			url: 'http://localhost:8080/release/'
		}
	]
} as Configuration
