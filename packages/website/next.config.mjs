import createNextIntlPlugin from 'next-intl/plugin'

const withIntl = createNextIntlPlugin('./i18n.ts')

const legacyDocRedirects = {
	cli: 'usage/cli',
	web: 'usage/web',
	desktop: 'usage/desktop',
	capture_contents: 'guides/capture_contents',
	agent_private_contents: 'guides/agent_private_contents',
	group_chat: 'guides/group_chat',
	project_workspace: 'guides/project_workspace',
	im_integration: 'guides/im_integration',
	content_service_providers: 'guides/content_service_providers',
	fst: 'system/fst',
	memory_callback: 'system/memory_callback',
	post_think: 'system/post_think',
	rewire_mechanisms: 'system/rewire_mechanisms'
}

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: false,
	transpilePackages: ['stk', 'shiki'],
	pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
	typescript: { ignoreBuildErrors: false },
	async redirects() {
		return Object.entries(legacyDocRedirects).map(([source, destination]) => ({
			source: `/docs/${source}`,
			destination: `/docs/${destination}`,
			permanent: true
		}))
	},
	experimental: {
		optimizePackageImports: ['@phosphor-icons/react', 'lucide-react']
	}
}

export default withIntl(config)
