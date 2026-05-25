import { cloudflare } from '@cloudflare/vite-plugin'
import vinext from 'vinext'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
	optimizeDeps: {
		exclude: ['next-intl']
	},
	resolve: {
		tsconfigPaths: true
	},
	plugins: [
		vinext(),
		svgr(),
		cloudflare({
			viteEnvironment: {
				name: 'rsc',
				childEnvironments: ['ssr']
			}
		})
	]
})
