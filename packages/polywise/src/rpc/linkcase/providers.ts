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
		id: 'curl.md',
		name: 'curl.md',
		description: 'URL-to-markdown provider for compact, agent-optimized web fetching.',
		detect: 'curl.md',
		install_commands: ['npm i -g curl.md', 'curl -fsSL https://curl.md/install.sh | bash'],
		docs_url: 'https://curl.md/docs/install'
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
