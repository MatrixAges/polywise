import { resolve } from 'node:path'

const workflow_root = resolve(process.cwd(), '.github/tsflows')
const workflow_entries = await Array.fromAsync(new Bun.Glob('*.ts').scan({ cwd: workflow_root }))

const run = async () => {
	const workflow_files = workflow_entries.sort((left, right) => left.localeCompare(right))

	if (workflow_files.length === 0) {
		throw new Error(`No workflow source files found in ${workflow_root}`)
	}

	for (const workflow_file of workflow_files) {
		const file_path = resolve(workflow_root, workflow_file)

		console.log(`Generating workflow from ${workflow_file}`)

		const proc = Bun.spawnSync(['bun', file_path], {
			stdio: ['ignore', 'inherit', 'inherit']
		})

		if (proc.exitCode !== 0) {
			throw new Error(`Failed to generate workflow for ${workflow_file}`)
		}
	}
}

await run()
