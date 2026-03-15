import type { RslibConfig } from '@rslib/core'

export default {
	mode: 'production',
	source: {
		decorators: { version: 'legacy' },
		tsconfigPath: './tsconfig.build.json'
	},
	lib: [
		{
			source: { entry: { index: './src/index.ts' } },
			format: 'esm',
			dts: true,
			autoExternal: false
		}
	],
	output: {
		target: 'node',
		externals: [
			'fs-extra',
			'better-sqlite3',
			'sqlite-vec',
			'@chonkiejs/token',
			'node-llama-cpp',
			'safer-buffer'
		],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	},
	performance: { removeConsole: false }
} as RslibConfig
