import { readFile, writeFile } from 'node:fs/promises'

const release_title_prefix = '## Polywise'
const conventional_commit_matcher = /^([a-z]+)(\([^)]+\))?!?:\s*/i
const internal_types = new Set(['chore', 'ci', 'build', 'test', 'docs', 'style', 'refactor', 'release'])
const ignored_messages = new Set(['wip', 'update', 'fix', 'bugfix', 'changes', 'misc'])

const readRequiredEnv = key => {
	const value = process.env[key]?.trim()

	if (!value) {
		throw new Error(`${key} is required`)
	}

	return value
}

const readCommitRecords = async () => {
	try {
		const raw_output = await readFile('commits.json', 'utf8')
		const parsed_output = JSON.parse(raw_output)

		return Array.isArray(parsed_output) ? parsed_output : Array()
	} catch {
		return Array()
	}
}

const readCommitType = subject => {
	const match = subject.trim().match(conventional_commit_matcher)

	return match?.[1]?.toLowerCase() || ''
}

const stripCommitPrefix = subject => subject.replace(conventional_commit_matcher, '').trim()

const isMeaningfulMessage = message => {
	const normalized_message = message.toLowerCase().replace(/\s+/g, ' ').trim()

	if (normalized_message.length < 5) {
		return false
	}

	if (ignored_messages.has(normalized_message)) {
		return false
	}

	return /[a-z0-9]/i.test(normalized_message)
}

const filterUserFacingCommits = commit_records =>
	commit_records.filter(commit_record => {
		const subject = `${commit_record?.subject || ''}`.trim()

		if (!subject) {
			return false
		}

		const commit_type = readCommitType(subject)

		if (commit_type && internal_types.has(commit_type)) {
			return false
		}

		return isMeaningfulMessage(stripCommitPrefix(subject))
	})

const createReleasePayload = commit_records =>
	commit_records.map(commit_record => ({
		hash: `${commit_record.short_hash || ''}`.trim(),
		url: `${commit_record.url || ''}`.trim(),
		message: `${commit_record.subject || ''}`.trim()
	}))

const buildPrompt = args => {
	const { release_tag, commit_payload } = args

	return `
Version: ${release_tag}

【Core Principles - Strictly Enforced】
1. Human-readable: describe product value and user experience, not implementation details or internal refactors.
2. Quality over quantity: only include substantial user-facing changes. Do not invent items or pad empty sections.
3. Smart merge: combine scattered commits from the same feature area into one cohesive bullet when they describe the same outcome.
4. Filter noise: ignore vague, repetitive, or purely development-facing commits even if they appear in the input.

【Output Format Requirements】
- Output Markdown only.
- The main title must be exactly: ${release_title_prefix} ${release_tag}
- Use these section headings in priority order, and omit any section with no qualifying items:
  - ### ✨ New Features
  - ### 🚀 Updates
  - ### 🐛 Fixed Bugs
- Use '-' for each bullet item.
- Each bullet must end with Markdown commit links in this format: ([hash1](url1), [hash2](url2))
- Do not wrap the answer in code fences.

【Input Data (JSON)】
${JSON.stringify(commit_payload, null, 2)}
`.trim()
}

const readTextContent = content => {
	if (typeof content === 'string' && content.trim()) {
		return content.trim()
	}

	if (!Array.isArray(content)) {
		return ''
	}

	const text_content = content
		.map(item => {
			if (typeof item === 'string') {
				return item
			}

			if (typeof item?.text === 'string') {
				return item.text
			}

			if (typeof item?.content === 'string') {
				return item.content
			}

			return ''
		})
		.join('')
		.trim()

	return text_content
}

const readResponseText = response_data => {
	const message_content = response_data?.choices?.[0]?.message?.content
	const text_content = readTextContent(message_content)

	if (!text_content) {
		return ''
	}

	return text_content
}

const requestReleaseNotes = async args => {
	const { api_key, request_body } = args
	const response = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${api_key}`
		},
		body: JSON.stringify(request_body)
	})

	if (!response.ok) {
		const error_text = await response.text()

		throw new Error(`DeepSeek API request failed: ${response.status} - ${error_text}`)
	}

	const response_data = await response.json()
	const response_text = readResponseText(response_data)

	if (!response_text) {
		throw new Error(
			`DeepSeek response did not contain release notes for ${request_body.model}: ${JSON.stringify(response_data)}`
		)
	}

	return response_text
}

const stripMarkdownFence = release_notes =>
	release_notes
		.replace(/^```[a-z]*\s*/i, '')
		.replace(/\s*```$/i, '')
		.trim()

const normalizeReleaseNotes = args => {
	const { release_tag, release_notes } = args
	const normalized_notes = stripMarkdownFence(release_notes)
	const release_title = `${release_title_prefix} ${release_tag}`

	if (normalized_notes.startsWith(release_title)) {
		return normalized_notes
	}

	return `${release_title}\n\n${normalized_notes}`.trim()
}

const createFallbackReleaseNotes = release_tag =>
	`${release_title_prefix} ${release_tag}

### 🚀 Updates
- This release mainly contains internal maintenance and dependency updates, with no major user-facing changes to highlight.`

const createReleaseMessages = prompt => [
	{
		role: 'system',
		content: 'You are the Product Release Manager for Polywise. Convert commit history into concise, accurate, user-facing release notes.'
	},
	{
		role: 'user',
		content: prompt
	}
]

const createPrimaryRequestBody = prompt => ({
	model: 'deepseek-v4-pro',
	messages: createReleaseMessages(prompt),
	thinking: { type: 'disabled' },
	stream: false
})

const createRetryRequestBody = prompt => ({
	model: 'deepseek-v4-flash',
	messages: createReleaseMessages(prompt),
	thinking: { type: 'disabled' },
	stream: false
})

const buildReleaseNotes = async args => {
	const { api_key, release_tag, commit_records } = args

	if (commit_records.length === 0) {
		return createFallbackReleaseNotes(release_tag)
	}

	const commit_payload = createReleasePayload(commit_records)
	const prompt = buildPrompt({
		release_tag,
		commit_payload
	})
	let release_notes = ''

	try {
		release_notes = await requestReleaseNotes({
			api_key,
			prompt,
			request_body: createPrimaryRequestBody(prompt)
		})
	} catch (error) {
		const error_message = error instanceof Error ? error.message : String(error)

		console.warn(
			`Primary DeepSeek release-notes request failed, retrying with fallback model: ${error_message}`
		)
		release_notes = await requestReleaseNotes({
			api_key,
			prompt,
			request_body: createRetryRequestBody(prompt)
		})
	}

	return normalizeReleaseNotes({
		release_tag,
		release_notes
	})
}

const run = async () => {
	const release_tag = readRequiredEnv('RELEASE_TAG')
	const commit_records = await readCommitRecords()
	const user_facing_commit_records = filterUserFacingCommits(commit_records)
	const api_key = user_facing_commit_records.length === 0 ? '' : readRequiredEnv('DEEPSEEK_API_KEY')
	const release_notes = await buildReleaseNotes({
		api_key,
		release_tag,
		commit_records: user_facing_commit_records
	})

	await writeFile('release-notes.md', `${release_notes.trim()}\n`, 'utf8')
}

await run()
