import { deepmerge } from 'deepmerge-ts'

import { rslib } from '../../config'

import type { RslibConfig } from '@rslib/core'

export default deepmerge(rslib, {
	source: { tsconfigPath: './tsconfig.build.json' },
	lib: [
		{
			source: { entry: { index: './src/index.ts' } },
			format: 'esm',
			dts: true,
			autoExternal: true
		}
	],
	output: {
		externals: ['@chonkiejs/token', 'onnxruntime-node', 'sharp'],
		filename: {
			js: '[name].js'
		}
	}
} as Partial<RslibConfig>)
