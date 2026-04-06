import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSvgr } from '@rsbuild/plugin-svgr'

import type { RsbuildConfig } from '@rsbuild/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'
const use_react_scan = false

const config = {
	source: { entry: { index: './index.tsx' }, decorators: { version: 'legacy' } },
	output: { legalComments: 'none', assetPrefix: './' },
	plugins: [pluginReact(), pluginSvgr()],
	performance: { removeConsole: false },
	dev: { lazyCompilation: { imports: true } },
	server: {
		open: false,
		port: 3071,
		cors: { origin: ['http://localhost:8787'] }
	},
	html: {
		title: 'Polywise - Where agents live ◑',
		template: './public/index.html'
	},
	tools: {
		lightningcssLoader: {
			targets: 'chrome >= 120',
			exclude: { isSelector: true }
		},
		rspack: {
			experiments: {
				nativeWatcher: true
			}
		}
	}
} as RsbuildConfig

if (use_react_scan) {
	config.html!.tags = [
		{
			tag: 'script',
			append: false,
			attrs: { src: 'https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js' }
		}
	]
}

export default config
