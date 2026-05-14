import { htmlToMarkdown, runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const fetchWithAgentBrowser: FetchProviderHandler = async ({ url, max_chars }) => {
	const open_result = await runCommand('agent-browser', ['open', url], 30000)

	if (open_result.exitCode !== 0) {
		throw new Error(open_result.stderr || open_result.stdout || 'agent-browser open failed')
	}

	const wait_result = await runCommand('agent-browser', ['wait', '--load', 'networkidle'], 45000)

	if (wait_result.exitCode !== 0) {
		throw new Error(wait_result.stderr || wait_result.stdout || 'agent-browser wait failed')
	}

	const html_result = await runCommand('agent-browser', ['get', 'html', 'body'], 15000)

	if (html_result.exitCode !== 0) {
		throw new Error(html_result.stderr || html_result.stdout || 'agent-browser get html failed')
	}

	if (!html_result.stdout.trim()) {
		throw new Error('agent-browser returned empty content')
	}

	const markdown = htmlToMarkdown(html_result.stdout)

	if (!markdown.trim()) {
		throw new Error('agent-browser markdown conversion returned empty content')
	}

	return {
		ok: true,
		source: 'agent-browser',
		...trimContent(markdown, max_chars)
	}
}

export default fetchWithAgentBrowser
