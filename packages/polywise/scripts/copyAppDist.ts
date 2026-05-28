import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { copy, pathExists, remove } from 'fs-extra'

const script_dir = dirname(fileURLToPath(import.meta.url))
const polywise_root = resolve(script_dir, '..')
const workspace_root = resolve(polywise_root, '..', '..')
const source_dir = resolve(workspace_root, 'packages/app/dist')
const target_dir = resolve(polywise_root, 'dist/app_dist')
const platform = (process.env.PLATFORM || process.env.POLYWISE_PLATFORM || 'standalone').trim().toLowerCase()

if (platform === 'electron') {
	console.log('Skipped copying app dist because PLATFORM=electron')
	process.exit(0)
}

if (!(await pathExists(source_dir))) {
	throw new Error(`App dist not found: ${source_dir}. Build packages/app first.`)
}

await remove(target_dir)
await copy(source_dir, target_dir)

console.log(`Copied app dist from ${source_dir} to ${target_dir}`)
