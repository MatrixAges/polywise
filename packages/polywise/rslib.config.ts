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
			source: {
				entry: {
					index: './src/index.ts',
					cli: './src/cli/index.ts',
					'pipeline/jieba.worker': './src/pipeline/getChunkWords/jieba.worker.ts'
				}
			},
			bundle: true,
			format: 'esm',
			dts: true,
			autoExternal: is_dev
		}
	],
	output: {
		target: 'node',
		minify: true,
		externals: [
			// /^globby(\/.*)?$/,
			/^trpc-to-openapi(\/.*)?$/,
			/^@chonkiejs\/core(\/.*)?$/,
			/^@node-rs\/xxhash(\/.*)?$/,
			/^@node-rs\/jieba(\/.*)?$/,
			/^@mongodb-js\/zstd(\/.*)?$/,
			/^simsimd(\/.*)?$/,
			/^fs-extra(\/.*)?$/,
			/^tinypool(\/.*)?$/,
			/^watchpack(\/.*)?$/,
			/^better-sqlite3(\/.*)?$/,
			/^sqlite-vec(\/.*)?$/,
			/^node-llama-cpp(\/.*)?$/,
			{ jws: 'module jws' },
			{ ws: 'module ws' },
			{ 'safer-buffer': 'module safer-buffer' }
		],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	},
	performance: { removeConsole: false },
	tools: {
		rspack: {
			target: 'node',
			module: {
				rules: [{ test: /\.(md|txt)$/i, type: 'asset/source' }]
			},
			optimization: { moduleIds: 'hashed' }
		}
	}
} as RslibConfig
