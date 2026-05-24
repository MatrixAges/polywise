/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: false,
	transpilePackages: ['stk', 'shiki'],
	pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
	typescript: { ignoreBuildErrors: false },
	experimental: {
		optimizePackageImports: ['antd', '@phosphor-icons/react', 'lucide-react']
	}
}

export default config
