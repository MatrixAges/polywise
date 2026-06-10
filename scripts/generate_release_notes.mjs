import { readFile, writeFile } from 'node:fs/promises'

const release_title_prefix = '## Polywise'
const conventional_commit_matcher = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*/i
const markdown_link_matcher = /\[([^\]]+)\]\(([^)]+)\)/g

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

const readCommitMetadata = subject => {
	const normalized_subject = `${subject || ''}`.trim()
	const match = normalized_subject.match(conventional_commit_matcher)
	const groups = match?.groups || {}
	const summary = normalized_subject.replace(conventional_commit_matcher, '').trim()

	return {
		type: `${groups.type || ''}`.toLowerCase(),
		scope: `${groups.scope || ''}`.trim(),
		is_breaking: groups.breaking === '!',
		summary,
		subject: normalized_subject
	}
}

const createReleasePayload = commit_records =>
	commit_records
		.map(commit_record => {
			const subject = `${commit_record?.subject || ''}`.trim()

			if (!subject) {
				return null
			}

			const commit_metadata = readCommitMetadata(subject)

			return {
				hash: `${commit_record.short_hash || ''}`.trim(),
				full_hash: `${commit_record.hash || ''}`.trim(),
				url: `${commit_record.url || ''}`.trim(),
				message: commit_metadata.subject,
				type: commit_metadata.type || 'other',
				scope: commit_metadata.scope,
				is_breaking: commit_metadata.is_breaking,
				summary: commit_metadata.summary || commit_metadata.subject
			}
		})
		.filter(Boolean)

const buildPrompt = args => {
	const { release_tag, commit_payload } = args

	return `
Version: ${release_tag}

【Core Principles - Strictly Enforced】
1. Full coverage is mandatory: every input commit must be represented exactly once in the final Markdown through bullet-link coverage. You may merge related commits into one bullet, but no commit may be omitted.
2. Features are highest priority: any commit that introduces a new capability, workflow, entry point, integration, or meaningful enhancement should be surfaced under "### ✨ New Features" when applicable. Features are the least acceptable category to omit.
3. User-facing first: write concise, readable release notes focused on product value, behavior changes, and real user impact.
4. Smart merge: combine related commits into one bullet when they describe the same outcome. You may simplify wording, but do not lose meaningful information from the input.
5. Accuracy only: do not invent behavior, user impact, or bug fixes that are not supported by the input.

【Output Format Requirements】
- Output Markdown only.
- The main title must be exactly: ${release_title_prefix} ${release_tag}
- Use these section headings in priority order, and omit any section with no qualifying items:
  - ### ✨ New Features
  - ### 🚀 Updates
  - ### 🐛 Fixed Bugs
  - ### 🛠️ Maintenance
- Use '-' for each bullet item.
- Each bullet must end with Markdown commit links in this format: ([hash1](url1), [hash2](url2))
- Use the provided "hash" field as the link label and the provided "url" field as the link target.
- Across all bullets, every input commit link must appear once and only once.
- Do not repeat the same commit link across multiple bullets.
- Keep bullets concise. Merging and simplification are encouraged, omission is not.
- Do not wrap the answer in code fences.

【Input Data (JSON)】
${JSON.stringify(commit_payload, null, 2)}
`.trim()
}

const buildRepairPrompt = args => {
	const { release_tag, commit_payload, validation_errors, previous_release_notes } = args

	return `
${buildPrompt({ release_tag, commit_payload })}

【Validation Failures From Previous Attempt】
${validation_errors.map(error_message => `- ${error_message}`).join('\n')}

【Previous Invalid Draft】
${previous_release_notes}

Rewrite the release notes from scratch. Do not explain the fixes. Output only the corrected Markdown release notes.
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

const readLinkedHashes = markdown => Array.from(markdown.matchAll(markdown_link_matcher)).map(match => match[1].trim())

const readSectionContent = args => {
	const { markdown, heading } = args
	const escaped_heading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const section_match = markdown.match(new RegExp(`${escaped_heading}[\\t ]*\\n([\\s\\S]*?)(?=\\n### |$)`))

	return section_match?.[1]?.trim() || ''
}

const groupHashCounts = hashes => {
	const hash_counts = new Map()

	for (const hash of hashes) {
		hash_counts.set(hash, (hash_counts.get(hash) || 0) + 1)
	}

	return hash_counts
}

const readReleaseNoteValidationErrors = args => {
	const { commit_payload, release_notes } = args
	const linked_hashes = readLinkedHashes(release_notes)
	const linked_hash_counts = groupHashCounts(linked_hashes)
	const expected_hashes = commit_payload.map(commit_record => commit_record.hash)
	const expected_hash_set = new Set(commit_payload.map(commit_record => commit_record.hash))
	const duplicate_hashes = Array.from(linked_hash_counts.entries())
		.filter(([, count]) => count > 1)
		.map(([hash]) => hash)
	const missing_hashes = expected_hashes.filter(hash => !linked_hash_counts.has(hash))
	const unexpected_hashes = Array.from(linked_hash_counts.keys()).filter(hash => !expected_hash_set.has(hash))
	const feature_hashes = commit_payload
		.filter(commit_record => commit_record.type === 'feat')
		.map(commit_record => commit_record.hash)
	const feature_section_hashes = new Set(
		readLinkedHashes(
			readSectionContent({
				markdown: release_notes,
				heading: '### ✨ New Features'
			})
		)
	)
	const missing_feature_hashes = feature_hashes.filter(hash => !feature_section_hashes.has(hash))
	const validation_errors = Array()

	if (missing_hashes.length > 0) {
		validation_errors.push(`Missing commit links: ${missing_hashes.join(', ')}`)
	}

	if (duplicate_hashes.length > 0) {
		validation_errors.push(`Duplicate commit links: ${duplicate_hashes.join(', ')}`)
	}

	if (unexpected_hashes.length > 0) {
		validation_errors.push(`Unexpected commit links: ${unexpected_hashes.join(', ')}`)
	}

	if (feature_hashes.length > 0 && missing_feature_hashes.length > 0) {
		validation_errors.push(
			`Feature commits must appear under "### ✨ New Features": ${missing_feature_hashes.join(', ')}`
		)
	}

	return validation_errors
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
	let validation_errors = Array()

	try {
		release_notes = await requestReleaseNotes({
			api_key,
			request_body: createPrimaryRequestBody(prompt)
		})
		validation_errors = readReleaseNoteValidationErrors({
			commit_payload,
			release_notes
		})

		if (validation_errors.length === 0) {
			return normalizeReleaseNotes({
				release_tag,
				release_notes
			})
		}

		console.warn(
			`Primary DeepSeek release-notes validation failed, retrying with fallback model: ${validation_errors.join('; ')}`
		)
	} catch (error) {
		const error_message = error instanceof Error ? error.message : String(error)

		console.warn(
			`Primary DeepSeek release-notes request failed, retrying with fallback model: ${error_message}`
		)
	}

	const retry_prompt = buildRepairPrompt({
		release_tag,
		commit_payload,
		validation_errors:
			validation_errors.length > 0 ? validation_errors : Array('Primary model request failed before validation.'),
		previous_release_notes: release_notes || '(empty)'
	})

	release_notes = await requestReleaseNotes({
		api_key,
		request_body: createRetryRequestBody(retry_prompt)
	})
	validation_errors = readReleaseNoteValidationErrors({
		commit_payload,
		release_notes
	})

	if (validation_errors.length > 0) {
		throw new Error(`Release notes validation failed: ${validation_errors.join('; ')}`)
	}

	return normalizeReleaseNotes({
		release_tag,
		release_notes
	})
}

const run = async () => {
	const release_tag = readRequiredEnv('RELEASE_TAG')
	const commit_records = await readCommitRecords()
	const api_key = commit_records.length === 0 ? '' : readRequiredEnv('DEEPSEEK_API_KEY')
	const release_notes = await buildReleaseNotes({
		api_key,
		release_tag,
		commit_records
	})

	await writeFile('release-notes.md', `${release_notes.trim()}\n`, 'utf8')
}

await run()
