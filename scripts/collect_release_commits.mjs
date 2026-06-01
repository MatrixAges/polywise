import { spawnSync } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'

const default_repo_slug = 'MatrixAges/polywise'

const appendOutput = async (key, value) => {
	if (!process.env.GITHUB_OUTPUT) {
		throw new Error('GITHUB_OUTPUT is required')
	}

	await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8')
}

const appendMultilineOutput = async (key, value) => {
	if (!process.env.GITHUB_OUTPUT) {
		throw new Error('GITHUB_OUTPUT is required')
	}

	const payload = `${key}<<EOF\n${value}\nEOF\n`

	await appendFile(process.env.GITHUB_OUTPUT, payload, 'utf8')
}

const getRepoSlug = () => process.env.GITHUB_REPOSITORY?.trim() || default_repo_slug

const parseCommitLine = line => {
	const [hash, short_hash, ...subject_parts] = line.split('\t')
	const subject = subject_parts.join('\t').trim()

	if (!hash || !short_hash || !subject) {
		return null
	}

	const repo_slug = getRepoSlug()

	return {
		hash,
		short_hash,
		subject,
		url: `https://github.com/${repo_slug}/commit/${hash}`
	}
}

const formatCommitBullets = commit_records =>
	commit_records
		.map(commit_record => `- ${commit_record.subject} ([${commit_record.short_hash}](${commit_record.url}))`)
		.join('\n')

const run = async () => {
	const previous_tag = process.env.PREVIOUS_TAG?.trim() || ''
	const release_commit = process.env.RELEASE_COMMIT?.trim()

	if (!release_commit) {
		throw new Error('RELEASE_COMMIT is required')
	}

	const revision_range = previous_tag ? `${previous_tag}..${release_commit}` : release_commit
	const log_proc = spawnSync('git', ['log', '--no-merges', '--pretty=format:%H%x09%h%x09%s', revision_range], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit']
	})

	if (log_proc.status !== 0) {
		throw new Error(`Failed to collect commits for ${revision_range}`)
	}

	const commit_lines = log_proc.stdout.split('\n').filter(Boolean)
	const commit_records = commit_lines.map(parseCommitLine).filter(Boolean)
	const commit_bullets = formatCommitBullets(commit_records) || '- No commit history available.'

	await writeFile('commits.txt', commit_bullets, 'utf8')
	await writeFile('commits.json', `${JSON.stringify(commit_records, null, 2)}\n`, 'utf8')
	await appendOutput('commit_count', String(commit_lines.length))
	await appendMultilineOutput('commit_bullets', commit_bullets)
}

await run()
