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
			autoExternal: false
		}
	],
	output: {
		externals: ['@chonkiejs/token'],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	},
	performance: { removeConsole: false },
	tools: {
		// rspack: config => {
		// 	// resolve https://github.com/web-infra-dev/rspack/issues/13086
		// 	config.optimization!.usedExports = false
		// 	return config
		// }
	}
} as Partial<RslibConfig>)
