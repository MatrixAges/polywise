import { defineConfig } from '@rslib/core'
import dotenv from 'dotenv'

import type { RslibConfig } from '@rslib/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'

const prod_output = {} as RslibConfig['output']

dotenv.config()

if (is_prod) prod_output!['minify'] = {}

export default defineConfig({
	mode: is_dev ? 'development' : 'production',
	lib: [
		{
			format: 'cjs',
			tools: { rspack: { target: 'electron-main' } }
		}
	],
	source: {
		entry: {
			index: './src/index.ts'
		},
		define: {
			'process.env.DEVTOOL': JSON.stringify(process.env.DEVTOOL)
		},
		decorators: { version: 'legacy' }
	},
	output: {
		cleanDistPath: is_prod,
		target: 'node',
		filename: { js: '[name].js' },
		...prod_output
	},
	performance: {
		chunkSplit: { strategy: 'split-by-module' },
		buildCache: is_dev
	}
})
