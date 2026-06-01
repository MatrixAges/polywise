import { readFile, writeFile } from 'node:fs/promises'

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const target_packages = ['polywise', 'app', 'desktop']

const updatePackageVersion = async package_name => {
	const package_path = `packages/${package_name}/package.json`
	const raw = await readFile(package_path, 'utf8')
	const data = JSON.parse(raw)

	data.version = process.env.RELEASE_VERSION

	await writeFile(package_path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const run = async () => {
	const release_version = process.env.RELEASE_VERSION?.trim()

	if (!release_version || !VERSION_PATTERN.test(release_version)) {
		throw new Error(`Invalid RELEASE_VERSION: ${release_version || ''}`)
	}

	await Promise.all(target_packages.map(updatePackageVersion))
}

await run()
