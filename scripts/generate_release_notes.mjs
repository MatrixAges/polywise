import { readFile, writeFile } from 'node:fs/promises'

const createFallbackNotes = args => {
	const { release_tag } = args

	return [
		`## Polywise ${release_tag}`,
		'',
		'### New Features',
		'No major new user-facing features were identified for this release.',
		'',
		'### Updates',
		'This release includes a set of general improvements and refinements across the product experience.',
		'',
		'### Fixed Bugs',
		'This release also contains bug fixes and stability work intended to improve reliability.',
		'',
		'### Others',
		'Additional internal cleanup and maintenance changes were included where needed.'
	].join('\n')
}

const createPrompt = args => {
	const { release_tag, previous_tag, commit_bullets } = args

	return [
		`You are a product writer creating release notes for end users. Based on the git commits provided, summarize the user-facing changes in Polywise ${release_tag} compared with ${previous_tag}.`,
		'Requirements:',
		'1. Only summarize changes that are supported by the commits. Do not invent features or fixes.',
		'2. Output in English Markdown.',
		'3. The output must contain exactly these sections in this order: "### New Features", "### Updates", "### Fixed Bugs", and "### Others".',
		'4. Under each section, write a short paragraph in plain language for normal users. Do not use bullet lists.',
		'5. If a section has nothing clearly relevant from the commits, write a brief sentence saying there are no major changes of that type in this release.',
		'6. Group items by their primary user impact. Put truly new capabilities in "New Features", improvements or refinements in "Updates", resolved issues in "Fixed Bugs", and maintenance, documentation, or developer-facing work in "Others".',
		'7. Do not include a "Related Commits" section, commit hashes, raw commit subjects, or any direct dump of the commit list.',
		'8. Do not say things like "based on the commits" or "from the commit history" in the final notes.',
		'',
		'Commit list for reference only:',
		commit_bullets || '- No commit history available.'
	].join('\n')
}

const run = async () => {
	const release_tag = process.env.RELEASE_TAG?.trim()
	const previous_tag = process.env.PREVIOUS_TAG?.trim() || 'No previous release'
	const api_key = process.env.DEEPSEEK_API_KEY?.trim()
	const commit_bullets = (await readFile('commits.txt', 'utf8')).trim()

	if (!release_tag) {
		throw new Error('RELEASE_TAG is required')
	}

	const fallback_notes = createFallbackNotes({ release_tag })

	if (!api_key) {
		await writeFile('release-notes.md', fallback_notes, 'utf8')
		return
	}

	const prompt = createPrompt({ release_tag, previous_tag, commit_bullets })
	const response = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${api_key}`
		},
		body: JSON.stringify({
			model: 'deepseek-chat',
			temperature: 0.2,
			messages: [
				{
					role: 'system',
					content: 'You turn engineering commits into concise, user-friendly English release notes.'
				},
				{ role: 'user', content: prompt }
			]
		})
	})

	if (!response.ok) {
		await writeFile('release-notes.md', fallback_notes, 'utf8')
		throw new Error(`DeepSeek request failed: ${response.status} ${await response.text()}`)
	}

	const data = await response.json()
	const content = data?.choices?.[0]?.message?.content?.trim()

	await writeFile('release-notes.md', content || fallback_notes, 'utf8')
}

await run()
