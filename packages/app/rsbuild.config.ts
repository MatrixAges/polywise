import { createRequire } from 'node:module'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSvgr } from '@rsbuild/plugin-svgr'

import type { RsbuildConfig } from '@rsbuild/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'
const platform = process.env.PLATFORM?.trim().toLowerCase() || 'electron'
const is_standalone = platform === 'standalone'
const asset_prefix = is_standalone ? '/app/' : './'
const use_react_scan = false
const require = createRequire(import.meta.url)
const react_entry = require.resolve('react')
const react_dom_entry = require.resolve('react-dom')
const jsx_runtime_entry = require.resolve('react/jsx-runtime')
const jsx_dev_runtime_entry = require.resolve('react/jsx-dev-runtime')
const html_tags = [] as Array<{ tag: string; append: boolean; attrs: Record<string, string> }>

const config = {
	source: { entry: { index: './index.tsx' }, decorators: { version: 'legacy' } },
	output: { legalComments: 'none', assetPrefix: is_dev ? undefined : asset_prefix },
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
	dev: {
		lazyCompilation: { imports: true },
		assetPrefix: '/'
	},
	server: {
		open: false,
		port: 3071,
		cors: { origin: ['http://localhost:8787'] }
	},
	html: {
		title: 'Polywise - agentic content system ◑',
		template: './public/index.html',
		tags: html_tags
	},
	tools: {
		swc: { jsc: { experimental: { plugins: [['@axew/swc-plugin-jsx-control-statements', {}]] } } },
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
	html_tags.push({
		tag: 'script',
		append: false,
		attrs: { href: 'https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js' }
	})
}

export default config
