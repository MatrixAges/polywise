import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

const readPackageVersion = async package_path => {
	const raw = await readFile(package_path, 'utf8')
	const data = JSON.parse(raw)

	if (!data?.version || typeof data.version !== 'string') {
		throw new Error(`Missing version in ${package_path}`)
	}

	return data.version.trim()
}

const parseVersion = version => {
	if (!VERSION_PATTERN.test(version)) {
		throw new Error(`Invalid version format: ${version}`)
	}

	return version.split('.').map(value => Number(value))
}

const stringifyVersion = version_parts => version_parts.join('.')

const incrementVersion = version => {
	const next_parts = parseVersion(version)

	next_parts[next_parts.length - 1] += 1

	for (let index = next_parts.length - 1; index > 0; index -= 1) {
		if (next_parts[index] < 10) {
			break
		}

		next_parts[index] = 0
		next_parts[index - 1] += 1
	}

	return stringifyVersion(next_parts)
}

const appendOutput = async (key, value) => {
	if (!process.env.GITHUB_OUTPUT) {
		throw new Error('GITHUB_OUTPUT is required')
	}

	await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8')
}

const run = async () => {
	const current_version = await readPackageVersion('packages/polywise/package.json')
	const requested_version = process.env.INPUT_VERSION?.trim() || ''

	const resolved_version = requested_version
		? stringifyVersion(parseVersion(requested_version))
		: incrementVersion(current_version)

	if (resolved_version === current_version) {
		throw new Error(`Resolved release version matches current version: ${resolved_version}`)
	}

	const release_tag = `v${resolved_version}`
	const previous_tag_proc = spawnSync(
		'bash',
		['-lc', `git tag --list 'v*' --sort=-v:refname | grep -vx '${release_tag}' | head -n 1 || true`],
		{
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'inherit']
		}
	)

	if (previous_tag_proc.status !== 0) {
		throw new Error('Failed to resolve previous tag')
	}

	const previous_tag = previous_tag_proc.stdout.trim()

	await appendOutput('current_version', current_version)
	await appendOutput('release_version', resolved_version)
	await appendOutput('release_tag', release_tag)
	await appendOutput('previous_tag', previous_tag)
}

await run()
