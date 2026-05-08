import { createRequire } from 'node:module'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSvgr } from '@rsbuild/plugin-svgr'

import type { RsbuildConfig } from '@rsbuild/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'
const use_react_scan = false
const require = createRequire(import.meta.url)
const react_entry = require.resolve('react')
const react_dom_entry = require.resolve('react-dom')
const jsx_runtime_entry = require.resolve('react/jsx-runtime')
const jsx_dev_runtime_entry = require.resolve('react/jsx-dev-runtime')

const config = {
	source: { entry: { index: './index.tsx' }, decorators: { version: 'legacy' } },
	output: { legalComments: 'none', assetPrefix: './' },
	plugins: [pluginReact(), pluginSvgr()],
	resolve: {
		alias: {
			react: react_entry,
			'react-dom': react_dom_entry,
			'react/jsx-runtime': jsx_runtime_entry,
			'react/jsx-dev-runtime': jsx_dev_runtime_entry
		}
	},
	performance: { removeConsole: false },
	dev: { lazyCompilation: { imports: true } },
	server: {
		open: false,
		port: 3071,
		cors: { origin: ['http://localhost:8787'] }
	},
	html: {
		title: 'Polywise - agentic content system ◑',
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
			},
			optimization: {
				moduleIds: 'hashed'
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
