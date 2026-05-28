import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(packageDir, '..', '..')
const pnpmStoreDir = path.join(repoRoot, 'node_modules', '.pnpm')

const nativeModules = [
	'better-sqlite3',
	'bufferutil',
	'lmdb',
	'simsimd',
	'utf-8-validate',
	'@mongodb-js/zstd',
	'usearch'
]

function resolveElectronRebuildCli() {
	const entry = readdirSync(pnpmStoreDir)
		.filter((name) => name.startsWith('@electron+rebuild@'))
		.sort()
		.at(-1)

	if (!entry) {
		throw new Error('Unable to find @electron/rebuild in the pnpm store.')
	}

	const cliPath = path.join(
		pnpmStoreDir,
		entry,
		'node_modules',
		'@electron',
		'rebuild',
		'lib',
		'cli.js'
	)

	if (!existsSync(cliPath)) {
		throw new Error(`Resolved @electron/rebuild entry does not contain lib/cli.js: ${cliPath}`)
	}

	return cliPath
}

const cliPath = resolveElectronRebuildCli()

// Exclude just-bash's optional node-liblzma codec, which fails on macOS
// because it expects system pkg-config/liblzma during Electron rebuilds.
const result = spawnSync(
	process.execPath,
	[
		cliPath,
		'--force',
		'--module-dir',
		'.',
		'--only',
		nativeModules.join(',')
	],
	{
		cwd: packageDir,
		stdio: 'inherit'
	}
)

if (result.error) {
	throw result.error
}

process.exit(result.status ?? 1)
