import { resolvePolywiseCrawl4aiProfileConfig } from '../utils/crawl4aiProfile'
import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const default_run_config_parts = [
	'wait_until=networkidle',
	'delay_before_return_html=3',
	'scan_full_page=true',
	'scroll_delay=0.4',
	'process_iframes=false',
	'remove_overlay_elements=true',
	'simulate_user=true',
	'override_navigator=true',
	'magic=true'
]

const default_browser_config_parts = [
	'headless=false',
	'enable_stealth=true',
	'user_agent_mode=random',
	'viewport_width=1440',
	'viewport_height=900'
]

const getCrawl4aiArgs = async (url: string) => {
	const crawler_config = process.env.CRAWL4AI_RUN_CONFIG?.trim()
	const args = [url, '-o', 'markdown', '--bypass-cache']
	const browser_config = process.env.CRAWL4AI_BROWSER_CONFIG?.trim()
	const browser_type = process.env.CRAWL4AI_BROWSER_TYPE?.trim() || 'chromium'
	const profile_config = await resolvePolywiseCrawl4aiProfileConfig()
	const browser_config_parts = [...default_browser_config_parts]

	args.push('-c', [...default_run_config_parts, crawler_config].filter(Boolean).join(','))

	if (profile_config?.user_data_dir) {
		browser_config_parts.push(
			'use_managed_browser=true',
			`user_data_dir=${profile_config.user_data_dir}`,
			`browser_type=${browser_type}`
		)

		if (profile_config.profile_name) {
			browser_config_parts.push(`profile_name=${profile_config.profile_name}`)
		}
	} else {
		browser_config_parts.push(`browser_type=${browser_type}`)
	}

	args.push('-b', [...browser_config_parts, browser_config].filter(Boolean).join(','))

	return args
}

const fetchWithCrawl4ai: FetchProviderHandler = async ({ url, max_chars }) => {
	const result = await runCommand('crwl', await getCrawl4aiArgs(url), 60000)

	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout || 'crwl failed')
	}

	if (!result.stdout.trim()) {
		throw new Error('crwl returned empty content')
	}

	return {
		ok: true,
		source: 'crawl4ai',
		...trimContent(result.stdout, max_chars)
	}
}

export default fetchWithCrawl4ai
