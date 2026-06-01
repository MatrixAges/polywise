import { readFile, writeFile } from 'node:fs/promises'

const section_names = ['New Features', 'Updates', 'Fixed Bugs', 'Others']
const max_items_per_section = 20
const max_summaries_per_group = 3
const max_links_per_item = 3

const section_by_type = {
	feat: 'New Features',
	fix: 'Fixed Bugs',
	bugfix: 'Fixed Bugs',
	perf: 'Updates',
	refactor: 'Updates',
	style: 'Updates',
	ui: 'Updates',
	ux: 'Updates',
	optimize: 'Updates',
	improve: 'Updates',
	enhance: 'Updates',
	i18n: 'Updates',
	docs: 'Others',
	chore: 'Others',
	ci: 'Others',
	build: 'Others',
	test: 'Others',
	release: 'Others'
}

const readCommitRecords = async () => {
	try {
		const raw = await readFile('commits.json', 'utf8')
		const data = JSON.parse(raw)

		return Array.isArray(data) ? data : []
	} catch {
		return []
	}
}

const createEmptySectionBullet = section_name => {
	if (section_name === 'New Features') return '- No major new user-facing features were identified in this release.'
	if (section_name === 'Updates') return '- No major user-facing updates were identified in this release.'
	if (section_name === 'Fixed Bugs') return '- No major bug fixes were highlighted for end users in this release.'
	return '- No major additional maintenance items were highlighted in this release.'
}

const normalizeDecoratedSubject = subject => subject.replace(/`{3,}/g, ' ').replace(/\s+/g, ' ').trim()

const parseCommitSegments = subject => {
	const normalized_subject = normalizeDecoratedSubject(subject)
	const matcher = /([a-z]+)(\(([^)]+)\))?!?:\s*/gi
	const matches = Array.from(normalized_subject.matchAll(matcher))

	if (matches.length === 0) {
		return [
			{
				type: 'other',
				scope: 'general',
				message: normalized_subject
			}
		]
	}

	return matches
		.map((match, index) => {
			const message_start = (match.index ?? 0) + match[0].length
			const next_match = matches[index + 1]
			const message_end = next_match?.index ?? normalized_subject.length
			const raw_message = normalized_subject
				.slice(message_start, message_end)
				.replace(/^[^a-zA-Z0-9]+/, '')
				.trim()

			return {
				type: match[1].toLowerCase(),
				scope: (match[3] || 'general').trim().toLowerCase(),
				message: raw_message || 'general release work'
			}
		})
		.filter(segment => segment.message)
}

const resolveSectionName = type => section_by_type[type] || 'Others'

const normalizeScope = scope => scope.replace(/[_/]+/g, '-').replace(/-+/g, '-').trim()

const scope_label_map = {
	ci: 'CI',
	ui: 'UI',
	ux: 'UX',
	im: 'IM',
	mdx: 'MDX',
	mcp: 'MCP',
	r2: 'R2',
	toc: 'TOC',
	appdata: 'App Data'
}

const humanizeScope = scope => {
	const normalized_scope = normalizeScope(scope || 'general')

	if (scope_label_map[normalized_scope]) {
		return scope_label_map[normalized_scope]
	}

	return normalized_scope
		.split('-')
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
}

const normalizeSummary = message => {
	const cleaned_message = message
		.replace(/\s+/g, ' ')
		.replace(/^[^a-zA-Z0-9]+/, '')
		.replace(/[^a-zA-Z0-9.)]+$/, '')
		.replace(/\.$/, '')
		.trim()

	if (!cleaned_message) {
		return 'general improvements'
	}

	return cleaned_message.charAt(0).toLowerCase() + cleaned_message.slice(1)
}

const stop_words = new Set([
	'add',
	'adds',
	'added',
	'update',
	'updates',
	'updated',
	'remove',
	'removes',
	'removed',
	'fix',
	'fixes',
	'fixed',
	'improve',
	'improves',
	'improved',
	'refine',
	'refines',
	'refined',
	'implement',
	'implements',
	'implemented',
	'introduce',
	'introduces',
	'introduced',
	'rename',
	'renames',
	'renamed',
	'replace',
	'replaces',
	'replaced',
	'simplify',
	'simplifies',
	'simplified',
	'adjust',
	'adjusts',
	'adjusted',
	'extract',
	'extracts',
	'extracted',
	'make',
	'makes',
	'made',
	'move',
	'moves',
	'moved',
	'set',
	'sets',
	'use',
	'uses',
	'used',
	'allow',
	'allows',
	'allowed',
	'prevent',
	'prevents',
	'prevented',
	'handle',
	'handles',
	'handled'
])

const createTopicKey = message => {
	const tokens = normalizeSummary(message)
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, ' ')
		.split(/\s+/)
		.filter(Boolean)
		.filter(token => !stop_words.has(token))
		.slice(0, 3)

	return tokens.length > 0 ? tokens.join('-') : 'general'
}

const createCommitLink = commit_record => `[${commit_record.short_hash}](${commit_record.url})`

const createLinkSuffix = commit_records => {
	const unique_commit_records = Array.from(
		new Map(commit_records.map(commit_record => [commit_record.hash, commit_record])).values()
	)
	const visible_links = unique_commit_records.slice(0, max_links_per_item).map(createCommitLink).join(', ')
	const hidden_count = unique_commit_records.length - Math.min(unique_commit_records.length, max_links_per_item)

	if (hidden_count <= 0) {
		return `(${visible_links})`
	}

	return `(${visible_links}; +${hidden_count} more commits)`
}

const createSectionGroups = commit_records => {
	const group_map = new Map()

	for (const commit_record of commit_records) {
		const segments = parseCommitSegments(commit_record.subject)

		for (const segment of segments) {
			const section_name = resolveSectionName(segment.type)
			const scope = normalizeScope(segment.scope || 'general')
			const topic = createTopicKey(segment.message)
			const group_key = `${section_name}::${scope}::${topic}`
			const next_group = group_map.get(group_key) || {
				section_name,
				scope,
				topic,
				summaries: Array(),
				commit_records: Array()
			}

			next_group.summaries.push(normalizeSummary(segment.message))
			next_group.commit_records.push(commit_record)
			group_map.set(group_key, next_group)
		}
	}

	return group_map
}

const sortGroups = groups =>
	groups.sort((left, right) => {
		const count_delta = right.commit_records.length - left.commit_records.length

		if (count_delta !== 0) {
			return count_delta
		}

		return left.scope.localeCompare(right.scope)
	})

const dedupeSummaries = summaries => Array.from(new Set(summaries.filter(Boolean)))

const createGroupBullet = group => {
	const summaries = dedupeSummaries(group.summaries)
	const visible_summaries = summaries.slice(0, max_summaries_per_group)
	const hidden_summary_count = summaries.length - visible_summaries.length
	const summary_text = visible_summaries.join('; ')
	const remainder_text = hidden_summary_count > 0 ? `; and ${hidden_summary_count} more changes` : ''
	const commit_count_text = group.commit_records.length > 1 ? ` across ${group.commit_records.length} commits` : ''

	return `- **${humanizeScope(group.scope)}**: ${summary_text}${remainder_text}${commit_count_text}. ${createLinkSuffix(group.commit_records)}`
}

const createOverflowBullet = args => {
	const { section_name, overflow_groups } = args
	const module_names = Array.from(new Set(overflow_groups.map(group => humanizeScope(group.scope))))
	const visible_modules = module_names.slice(0, 4).join(', ')
	const hidden_module_count = module_names.length - Math.min(module_names.length, 4)
	const module_suffix = hidden_module_count > 0 ? `, and ${hidden_module_count} more modules` : ''
	const all_commit_records = overflow_groups.flatMap(group => group.commit_records)
	const label =
		section_name === 'New Features'
			? 'Additional new features'
			: section_name === 'Updates'
				? 'Additional updates'
				: section_name === 'Fixed Bugs'
					? 'Additional bug fixes'
					: 'Additional maintenance work'

	return `- ${label} across ${visible_modules}${module_suffix}. ${createLinkSuffix(all_commit_records)}`
}

const createSectionLines = args => {
	const { section_name, groups } = args

	if (groups.length === 0) {
		return [createEmptySectionBullet(section_name)]
	}

	if (groups.length <= max_items_per_section) {
		return groups.map(createGroupBullet)
	}

	const visible_groups = groups.slice(0, max_items_per_section - 1)
	const overflow_groups = groups.slice(max_items_per_section - 1)

	return [...visible_groups.map(createGroupBullet), createOverflowBullet({ section_name, overflow_groups })]
}

const buildReleaseNotes = args => {
	const { release_tag, commit_records } = args
	const group_map = createSectionGroups(commit_records)

	return [
		`## Polywise ${release_tag}`,
		'',
		...section_names.flatMap(section_name => {
			const groups = sortGroups(
				Array.from(group_map.values()).filter(group => group.section_name === section_name)
			)

			return [`### ${section_name}`, ...createSectionLines({ section_name, groups }), '']
		})
	]
		.join('\n')
		.trimEnd()
}

const run = async () => {
	const release_tag = process.env.RELEASE_TAG?.trim()
	const commit_records = await readCommitRecords()

	if (!release_tag) {
		throw new Error('RELEASE_TAG is required')
	}

	await writeFile('release-notes.md', buildReleaseNotes({ release_tag, commit_records }), 'utf8')
}

await run()
