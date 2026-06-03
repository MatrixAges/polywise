import { APP_ID, TEAM_ID } from './metadata'
import { productName } from './package.json'
import { afterPack } from './scripts/beforePack'

import type { Configuration } from 'electron-builder'

const build_arch = process.env.BUILD_ARCH
const arch = build_arch === 'arm64' ? ['arm64'] : build_arch === 'x64' ? ['x64'] : ['x64']

export default {
	appId: APP_ID,
	productName,
	asar: true,
	compression: 'maximum',
	npmRebuild: false,
	directories: { output: 'release/${platform}/${arch}' },
	files: [
		'public/**/*',
		'dist/**/*',
		'!**/*.gguf',
		'!**/tsconfig.json',
		'!**/node_modules/**/*.{ts,map,md,txt,map,d.ts,d.cts,d.mts}',
		'!**/node_modules/**/{test,tests,example,examples,docs,script,LICENSE,\@types}',
		'!**/node_modules/polywise/.test',
		'!**/node_modules/polywise/.test/**/*',
		'!**/node_modules/polywise/dist/app_dist',
		'!**/node_modules/polywise/dist/app_dist/**/*'
	],
	extraResources: [{ from: '../app/dist', to: 'app_dist' }],
	artifactName: '${productName}-${version}-${arch}.${ext}',
	mac: {
		identity: null,

		notarize: true,
		target: [
			{ target: 'dmg', arch },
			{ target: 'zip', arch }
		],
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
	dmg: { sign: true },
	win: {
		target: [{ target: 'nsis', arch: ['x64'] }],
		icon: 'public/icons/icon.ico',
		compression: 'maximum',
		fileAssociations: [{ ext: 'elefile', icon: 'public/icons/icon.ico' }]
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
