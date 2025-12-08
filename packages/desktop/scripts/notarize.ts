import { notarize } from '@electron/notarize'

import type { AfterPackContext } from 'electron-builder'

export default (context: AfterPackContext) => {
	const { electronPlatformName, appOutDir } = context

	if (electronPlatformName !== 'darwin') return

	const appName = context.packager.appInfo.productFilename

	console.log(appName, ' is notarizing...')

	return notarize({
		teamId: process.env.APPLE_TEAM_ID!,
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLE_ID!,
		appleIdPassword: process.env.APPLE_ID_PASSWORD!
	})
}
