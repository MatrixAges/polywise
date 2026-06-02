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

const parseJson = raw_output => JSON.parse(raw_output || '{}')

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
	let page_number = 1

	while (true) {
		const raw_output = runGh({
			args: ['api', `repos/${repo_slug}/releases?per_page=3&page=${page_number}`]
		})
		const releases = JSON.parse(raw_output || '[]')

		if (releases.length === 0) {
			return null
		}

		const matched_release =
			releases.find(release_item => release_item.tag_name === release_tag && release_item.draft === true) ||
			null

		if (matched_release) {
			return matched_release
		}

		page_number += 1
	}
}

const buildReleasePayload = async args => {
	const { release_commit, release_tag } = args
	const release_notes = await readFile('release-notes.md', 'utf8')

	return JSON.stringify({
		tag_name: release_tag,
		draft: true,
		name: release_tag,
		target_commitish: release_commit,
		body: release_notes
	})
}

const updateDraftRelease = async args => {
	const { existing_draft_id, release_commit, release_tag } = args
	const payload = await buildReleasePayload({
		release_commit,
		release_tag
	})
	const repo_slug = getRepoSlug()

	return parseJson(
		runGh({
			args: [
				'api',
				'--method',
				'PATCH',
				`repos/${repo_slug}/releases/${existing_draft_id}`,
				'--input',
				'-'
			],
			input: payload
		})
	)
}

const createDraftRelease = async args => {
	const { release_commit, release_tag } = args
	const payload = await buildReleasePayload({
		release_commit,
		release_tag
	})
	const repo_slug = getRepoSlug()

	return parseJson(
		runGh({
			args: ['api', '--method', 'POST', `repos/${repo_slug}/releases`, '--input', '-'],
			input: payload
		})
	)
}

const run = async () => {
	const release_tag = readRequiredEnv('RELEASE_TAG')
	const release_commit = readRequiredEnv('RELEASE_COMMIT')
	const existing_draft_id = process.env.EXISTING_DRAFT_ID?.trim() || ''
	let draft_release = null

	if (existing_draft_id) {
		draft_release = await updateDraftRelease({
			existing_draft_id,
			release_commit,
			release_tag
		})
	} else {
		draft_release = await createDraftRelease({
			release_commit,
			release_tag
		})
	}

	if (!draft_release?.id || !draft_release?.html_url) {
		const fallback_draft_release = readDraftRelease(release_tag)

		if (!fallback_draft_release?.id || !fallback_draft_release?.html_url) {
			throw new Error(`Failed to resolve draft release for ${release_tag}`)
		}

		draft_release = fallback_draft_release
	}

	await appendOutput('id', String(draft_release.id))
	await appendOutput('url', draft_release.html_url)
}

await run()
