import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'

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

const runGh = ({ args, input }) => {
	const gh_proc = spawnSync('gh', args, {
		encoding: 'utf8',
		input,
		stdio: ['pipe', 'pipe', 'pipe']
	})

	if (gh_proc.status !== 0) {
		const error_message = `${gh_proc.stderr || gh_proc.stdout}`.trim()

		throw new Error(`Failed to run gh ${args.join(' ')}: ${error_message}`)
	}

	return gh_proc.stdout.trim()
}

const readDraftRelease = release_tag => {
	const repo_slug = getRepoSlug()
	const raw_output = runGh({
		args: ['api', `repos/${repo_slug}/releases?per_page=100`]
	})
	const releases = JSON.parse(raw_output || '[]')

	return releases.find(release_item => release_item.tag_name === release_tag && release_item.draft === true) || null
}

const updateDraftRelease = async args => {
	const { existing_draft_id, release_commit, release_tag } = args
	const release_notes = await readFile('release-notes.md', 'utf8')
	const payload = JSON.stringify({
		draft: true,
		name: release_tag,
		target_commitish: release_commit,
		body: release_notes
	})
	const repo_slug = getRepoSlug()

	runGh({
		args: ['api', '--method', 'PATCH', `repos/${repo_slug}/releases/${existing_draft_id}`, '--input', '-'],
		input: payload
	})
}

const createDraftRelease = args => {
	const { release_commit, release_tag } = args

	runGh({
		args: [
			'release',
			'create',
			release_tag,
			'--draft',
			'--title',
			release_tag,
			'--target',
			release_commit,
			'--notes-file',
			'release-notes.md'
		]
	})
}

const run = async () => {
	const release_tag = readRequiredEnv('RELEASE_TAG')
	const release_commit = readRequiredEnv('RELEASE_COMMIT')
	const existing_draft_id = process.env.EXISTING_DRAFT_ID?.trim() || ''

	if (existing_draft_id) {
		await updateDraftRelease({
			existing_draft_id,
			release_commit,
			release_tag
		})
	} else {
		createDraftRelease({
			release_commit,
			release_tag
		})
	}

	const draft_release = readDraftRelease(release_tag)

	if (!draft_release?.id || !draft_release?.html_url) {
		throw new Error(`Failed to resolve draft release for ${release_tag}`)
	}

	await appendOutput('id', String(draft_release.id))
	await appendOutput('url', draft_release.html_url)
}

await run()
