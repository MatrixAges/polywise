import { resolvePolywiseCrawl4aiProfileConfig } from '../utils/crawl4aiProfile'
import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const getCrawl4aiArgs = async (url: string) => {
	const args = [
		url,
		'-o',
		'markdown',
		'--bypass-cache',
		'-c',
		'wait_until=networkidle,delay_before_return_html=1,scan_full_page=true,process_iframes=false,remove_overlay_elements=true,magic=true'
	]
	const browser_config = process.env.CRAWL4AI_BROWSER_CONFIG?.trim()
	const browser_type = process.env.CRAWL4AI_BROWSER_TYPE?.trim() || 'chromium'
	const profile_config = await resolvePolywiseCrawl4aiProfileConfig()

	if (profile_config?.user_data_dir) {
		const managed_browser_config = [
			'use_managed_browser=true',
			`user_data_dir=${profile_config.user_data_dir}`,
			profile_config.profile_name ? `profile_name=${profile_config.profile_name}` : '',
			`browser_type=${browser_type}`,
			'headless=true',
			browser_config
		]
			.filter(Boolean)
			.join(',')

		args.push('-b', managed_browser_config)
	} else if (browser_config) {
		args.push('-b', browser_config)
	}

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
