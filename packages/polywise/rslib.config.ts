import type { RslibConfig } from '@rslib/core'

const is_dev = process.env.NODE_ENV === 'development'
const is_prod = process.env.NODE_ENV === 'production'

export default {
	mode: is_dev ? 'development' : 'production',
	source: {
		decorators: { version: 'legacy' },
		tsconfigPath: './tsconfig.build.json'
	},
	lib: [
		{
			source: { entry: { index: './src/index.ts' } },
			format: 'esm',
			dts: true,
			autoExternal: is_dev
		}
	],
	output: {
		target: 'node',
		externals: [
			/^@chonkiejs\/core(\/.*)?$/,
			/^@node-rs\/xxhash(\/.*)?$/,
			/^@node-rs\/jieba(\/.*)?$/,
			/^fs-extra(\/.*)?$/,
			/^watchpack(\/.*)?$/,
			/^better-sqlite3(\/.*)?$/,
			/^sqlite-vec(\/.*)?$/,
			/^node-llama-cpp(\/.*)?$/,
			{ 'safer-buffer': 'module safer-buffer' }
		],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	},
	performance: { removeConsole: false }
} as RslibConfig
