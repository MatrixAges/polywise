export const linkcase_content_providers = [
	{
		id: 'agent-browser',
		name: 'Agent Browser',
		description:
			'Native browser automation provider for agent-driven page navigation and extraction, with Chrome profile and CDP attach support.',
		detect: 'agent-browser',
		install_commands: ['npm install -g agent-browser && agent-browser install'],
		docs_url: 'https://agent-browser.dev/installation'
	},
	{
		id: 'opencli',
		name: 'OpenCLI',
		description:
			'CLI browser/content provider that uses Browser Bridge to drive your logged-in Chrome session.',
		detect: 'opencli',
		install_commands: ['npm install -g @jackwener/opencli'],
		docs_url: 'https://opencli.info/docs/guide/installation.html'
	},
	{
		id: 'crawl4ai',
		name: 'Crawl4AI',
		description:
			'CLI crawler with markdown output and managed Chromium profile support for logged-in local sessions.',
		detect: 'crwl',
		install_commands: ['python3 -m pip install -U crawl4ai && crawl4ai-setup'],
		docs_url: 'https://docs.crawl4ai.com/core/cli/'
	},
	{
		id: 'dokobot',
		name: 'Dokobot',
		description:
			'Local browser agent CLI that can read through your logged-in Chrome session via the Dokobot extension bridge.',
		detect: 'dokobot',
		install_commands: ['npm i -g @dokobot/cli@latest'],
		docs_url: 'https://dokobot.ai/zh-CN/help/install-cli'
	}
] as const

export type LinkcaseContentProviderId = (typeof linkcase_content_providers)[number]['id']

export type LinkcaseProviderCheckStatus = 'ok' | 'warning' | 'missing' | 'info'

export type LinkcaseProviderCheck = {
	id: string
	label: string
	status: LinkcaseProviderCheckStatus
	detail: string
	action_url?: string
	action_label?: string
}
