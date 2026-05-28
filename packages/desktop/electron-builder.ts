import { TEAM_ID } from './metadata'
import { productName } from './package.json'
import { afterPack } from './scripts/beforePack'

import type { Configuration } from 'electron-builder'

const { ZIP } = process.env
// const arch = ['x64', 'arm64']
const arch = ['x64']

export default {
	productName,
	asar: true,
	compression: 'normal',
	npmRebuild: false,
	directories: { output: (ZIP ? 'zip' : 'release') + '/${platform}/${arch}' },
	files: [
		'public/**/*',
		'dist/**/*',
		'!dist/notarize.js',
		'!**/node_modules/**/*.{ts,map,md,txt,map}',
		'!**/node_modules/**/{test,tests,example,examples,docs,script}',
		'!**/node_modules/**/onnxruntime-common/**/esm'
	],
	extraResources: [{ from: '../app/dist', to: 'app_dist' }],
	artifactName: '${productName}-${version}-${arch}.${ext}',
	mac: {
		identity: null,
		target: ZIP ? { target: 'zip', arch } : { target: 'dmg', arch },
		hardenedRuntime: true,
		gatekeeperAssess: false,
		icon: 'public/icons/app.icns',
		entitlements: './metadata/entitlements.plist',
		entitlementsInherit: './metadata/entitlements.plist',
		extendInfo: {
			ElectronTeamID: TEAM_ID,
			CFBundleName: productName,
			CFBundleDisplayName: productName,
			LSHasLocalizedDisplayName: true,
			LSMultipleInstancesProhibited: true,
			ITSAppUsesNonExemptEncryption: false
		},
		fileAssociations: [{ ext: 'elefile', icon: 'public/icons/logo.icns' }]
	},
	// dmg: { sign: true },
	win: {
		target: [{ target: 'nsis', arch: ['x64'] }],
		icon: 'public/icons/icon.ico',
		compression: 'maximum',
		fileAssociations: [{ ext: 'elefile', icon: 'public/icons/icon.ico' }],
		asarUnpack: ['**/node_modules/onnxruntime-node/bin/napi-v3/win32/${arch}/**/*']
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
	fileAssociations: [{ name: productName, ext: 'elefile' }],
	publish: [{ provider: 'generic', url: 'http://localhost:8080/release/' }],
	afterPack
} as Configuration
