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
		externals: ['@chonkiejs/token', 'node-llama-cpp'],
		filename: { js: '[name].js' },
		copy: [{ from: './drizzle', to: 'drizzle' }]
	}
	// performance: { removeConsole: false },
	// tools: {
	// 	rspack: config => {
	// 		config.target = 'node'

	// 		if (config.output) {
	// 			config.output.publicPath = ''
	// 		}

	// 		// resolve https://github.com/web-infra-dev/rspack/issues/13086

	// 		// config.externalsType = 'module'
	// 		// config.optimization!.innerGraph = false
	// 		// config.optimization!.usedExports = false
	// 		// config.optimization!.concatenateModules = false
	// 		// config.optimization!.splitChunks = false

	// 		return config
	// 	}
	// }
} as Partial<RslibConfig>
