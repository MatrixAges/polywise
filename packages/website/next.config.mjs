import createNextIntlPlugin from 'next-intl/plugin'

const withIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: false,
	transpilePackages: ['stk', 'shiki'],
	pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
	typescript: { ignoreBuildErrors: false },
	experimental: {
		optimizePackageImports: ['@phosphor-icons/react', 'lucide-react']
	}
}

export default withIntl(config)
