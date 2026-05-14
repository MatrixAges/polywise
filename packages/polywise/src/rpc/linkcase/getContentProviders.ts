import { p } from '@core/utils'

import { linkcase_content_providers } from './providers'
import {
	getAgentBrowserChromeProfileCheck,
	getCrawl4aiProfileCheck,
	getDokobotBridgeCheck,
	getOpencliBrowserBridgeCheck,
	isToolInstalled
} from './runtime'

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

			if (item.id === 'crawl4ai') {
				checks.push(await getCrawl4aiProfileCheck())
			}

			if (item.id === 'dokobot') {
				checks.push(
					installed
						? await getDokobotBridgeCheck()
						: {
								id: 'browser-bridge',
								label: 'Browser bridge',
								status: 'missing',
								detail: 'Install Dokobot CLI first, then set up the extension bridge for local mode.',
								action_label: 'Setup guide',
								action_url: 'https://dokobot.ai/zh-CN/help/agent-features'
							}
				)
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
