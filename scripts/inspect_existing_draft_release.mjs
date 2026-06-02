import { spawnSync } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'

const default_repo_slug = 'MatrixAges/polywise'

const readRequiredEnv = key => {
	const value = process.env[key]?.trim()

	if (!value) {
		throw new Error(`${key} is required`)
	}

	return value
}

const appendOutput = async (key, value) => {
	if (!process.env.GITHUB_OUTPUT) {
		throw new Error('GITHUB_OUTPUT is required')
	}

	await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8')
}

const getRepoSlug = () => process.env.GITHUB_REPOSITORY?.trim() || default_repo_slug

const runGh = args => {
	const gh_proc = spawnSync('gh', args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	})

	if (gh_proc.status !== 0) {
		const error_message = `${gh_proc.stderr || gh_proc.stdout}`.trim()

		throw new Error(`Failed to run gh ${args.join(' ')}: ${error_message}`)
	}

	return gh_proc.stdout.trim()
}

const readDraftRelease = release_tag => {
	const repo_slug = getRepoSlug()
	const raw_output = runGh(['api', `repos/${repo_slug}/releases?per_page=40`])
	const releases = JSON.parse(raw_output || '[]')

	return releases.find(release_item => release_item.tag_name === release_tag && release_item.draft === true) || null
}

const writeMissingOutputs = async () => {
	await appendOutput('draft_exists', 'false')
	await appendOutput('id', '')
	await appendOutput('target_commitish', '')
	await appendOutput('url', '')
}

const writeFoundOutputs = async draft_release => {
	await writeFile('release-notes.md', draft_release.body || '', 'utf8')
	await appendOutput('draft_exists', 'true')
	await appendOutput('id', String(draft_release.id || ''))
	await appendOutput('target_commitish', draft_release.target_commitish || '')
	await appendOutput('url', draft_release.html_url || '')
}

const run = async () => {
	const release_tag = readRequiredEnv('RELEASE_TAG')
	const draft_release = readDraftRelease(release_tag)

	if (!draft_release) {
		await writeMissingOutputs()
		return
	}

	await writeFoundOutputs(draft_release)
}

await run()
