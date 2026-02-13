import type { Build, CompileBuildOptions } from 'bun'

const targets = ['bun-linux-x64', 'bun-windows-x64', 'bun-darwin-x64', 'bun-darwin-arm64'] as Array<Build.CompileTarget>

const build = async (target: Build.CompileTarget) => {
	const result = await Bun.build({
		entrypoints: ['./src/index.ts'],
		outdir: './dist',
		target: 'bun',
		compile: {
			outfile: 'polywise' + target.replace('bun', ''),
			target
		} as CompileBuildOptions,
		external: ['sharp', '@img/sharp-wasm32', '@img/sharp-libvips-dev']
	})

	console.log(result)

	if (!result.success) {
		console.error('Build failed')
		console.error(JSON.stringify(result.logs))

		process.exit(1)
	}

	console.log('Build successful!')
}

targets.map(item => build(item))
