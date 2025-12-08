import dotenv from 'dotenv'

import { defineConfig } from '@rslib/core'

import type { RslibConfig } from '@rslib/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'

const prod_output = {} as RslibConfig['output']

dotenv.config()

if (is_prod) prod_output!['minify'] = {}

export default defineConfig({
	mode: is_dev ? 'development' : 'production',
	lib: [{ format: 'cjs' }],
	source: {
		entry: { index: './src/index.ts' },
		define: {
			// 'process.env.DEVTOOL': JSON.stringify(is_dev ? '1' : '0'),
			'process.env.DEVTOOL': JSON.stringify('1'),
			'process.env.RECALLAI_API_URL': JSON.stringify(process.env.RECALLAI_API_URL),
			'process.env.RECALLAI_API_KEY': JSON.stringify(process.env.RECALLAI_API_KEY),
			'process.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY)
		},
		decorators: { version: 'legacy' }
	},
	output: {
		sourceMap: is_dev,
		cleanDistPath: false,
		target: 'node',
		filename: { js: 'index.js' },
		...prod_output
	},
	performance: {
		chunkSplit: { strategy: 'split-by-module' },
		buildCache: is_dev
	},
	tools: {
		rspack: {
			target: 'electron-main',
			module: {
				rules: [
					{
						test: /\.(md|txt)$/i,
						type: 'asset/source'
					}
				]
			}
		}
	}
})
