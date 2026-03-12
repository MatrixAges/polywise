import type { RslibConfig } from '@rslib/core'

export default {
	mode: 'production',
	source: {
		decorators: { version: 'legacy' },
		tsconfigPath: './tsconfig.build.json',
		define: { 'entityKind;': undefined }
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
		externals: ['@chonkiejs/token', 'node-llama-cpp', 'fs-extra'],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	},
	performance: { removeConsole: false }
} as RslibConfig
