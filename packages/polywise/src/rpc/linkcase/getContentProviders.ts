import { p } from '@core/utils'

import { linkcase_content_providers } from './providers'
import { getAgentBrowserChromeProfileCheck, getOpencliBrowserBridgeCheck, isToolInstalled } from './runtime'

export default p.query(async () => {
	const providers = await Promise.all(
		linkcase_content_providers.map(async item => {
			const installed = await isToolInstalled(item.detect)
			const checks = []

			if (item.id === 'opencli') {
				checks.push(
					installed
						? await getOpencliBrowserBridgeCheck()
						: {
								id: 'browser-bridge',
								label: 'Browser Bridge',
								status: 'missing',
								detail: 'Install opencli first, then connect the Browser Bridge extension.',
								action_label: 'Install bridge',
								action_url: 'https://github.com/jackwener/opencli/releases'
							}
				)
			}

			if (item.id === 'agent-browser') {
				checks.push(await getAgentBrowserChromeProfileCheck())
			}

			return {
				...item,
				installed,
				ready: installed && checks.every(check => check.status === 'ok' || check.status === 'info'),
				checks
			}
		})
	)

	return { providers }
})
