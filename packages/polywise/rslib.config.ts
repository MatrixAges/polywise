import { deepmerge } from 'deepmerge-ts'

import { rslib } from '../../config'

import type { RslibConfig } from '@rslib/core'

export default deepmerge(rslib, {
	lib: [
		{
			source: { entry: { index: './src/index.ts' } },
			format: 'esm',
			dts: true,
			autoExternal: false
		}
	],
	output: {
		externals: {
			'@img/sharp-wasm32/versions': 'module @img/sharp-wasm32/versions',
			'@img/sharp-libvips-dev/include': 'module @img/sharp-libvips-dev/include',
			'@img/sharp-libvips-dev/cplusplus': 'module @img/sharp-libvips-dev/cplusplus',
			'@chonkiejs/token': '@chonkiejs/token'
		},
		filename: {
			js: '[name].js'
		}
	}
} as Partial<RslibConfig>)
