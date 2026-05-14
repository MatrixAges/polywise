import { config } from '@core/config'
import { default_fetch_fallback_chain } from '@core/types'
import { p } from '@core/utils'

import { getPolywiseCrawl4aiManagedProfile } from '../../utils/crawl4aiProfile'
import { linkcase_content_providers } from './providers'
import {
	getAgentBrowserChromeProfileCheck,
	getCrawl4aiProfileCheck,
	getDokobotBridgeCheck,
	getOpencliBrowserBridgeCheck,
	isToolInstalled
} from './runtime'

export default p.query(async () => {
	const fallback_chain =
		Array.isArray(config.fetch_fallback_chain) && config.fetch_fallback_chain.length
			? config.fetch_fallback_chain
			: [...default_fetch_fallback_chain]
	const provider_order_map = new Map(fallback_chain.map((id, index) => [id, index]))
	const ordered_provider_defs = [...linkcase_content_providers].sort((a, b) => {
		const a_index = provider_order_map.get(a.id) ?? Number.MAX_SAFE_INTEGER
		const b_index = provider_order_map.get(b.id) ?? Number.MAX_SAFE_INTEGER

		return a_index - b_index
	})
	const providers = await Promise.all(
		ordered_provider_defs.map(async item => {
			const installed = await isToolInstalled(item.detect)
			const checks = []
			const crawl4ai_profile =
				item.id === 'crawl4ai' ? await getPolywiseCrawl4aiManagedProfile() : undefined

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
				checks,
				crawl4ai_profile
			}
		})
	)

	return { providers }
})
