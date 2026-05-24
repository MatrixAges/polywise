import { findSuggestionMatch } from '@tiptap/suggestion'
import {
	Container,
	File,
	FileArchive,
	FileCode2,
	FileImage,
	FileJson2,
	FileSpreadsheet,
	FileText,
	Folder
} from 'lucide-react'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type {
	ActiveMention,
	AgentMentionItem,
	FileMentionItem,
	MentionItem,
	MentionSection,
	SessionTokenAttrs,
	SkillMentionItem,
	ToolMentionItem
} from './types'

export const submit_modes = [
	{ label: 'Enter Mode', value: 'enter' },
	{ label: 'Ctrl+Enter Mode', value: 'ctrl+enter' }
]

export const session_modes = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Plan', value: 'plan' },
	{ label: 'Plan-Exec', value: 'plan-exec' }
]

export const audit_modes = [
	{ label: 'Limited', value: 'limited' },
	{ label: 'Auto', value: 'auto' },
	{ label: 'Full Access', value: 'full' }
]

export const effort_modes = [
	{ label: 'Default', value: 'default' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'XHigh', value: 'xhigh' }
]

const mention_limit = 50
const skill_type_label_map = {
	system: 'System'
} as const

export const builtin_system_skills = [
	{
		key: 'builtin-skill-creator',
		label: 'skill-creator',
		desc: 'Create or update reusable local skills from repeated workflows or failure patterns.'
	},
	{
		key: 'builtin-skill-installer',
		label: 'skill-installer',
		desc: 'Install a curated skill or a skill from another repository into the local skills directory.'
	}
] satisfies Array<Pick<SkillMentionItem, 'key' | 'label' | 'desc'>>

export const getPathSegments = (value: string) => value.replace(/\/$/, '').split('/').filter(Boolean)

export const getBasename = (value: string) => {
	const segments = getPathSegments(value)

	return segments.at(-1) || value
}

export const getFileExtension = (value: string) => {
	const basename = getBasename(value)
	const index = basename.lastIndexOf('.')

	if (index === -1) return ''

	return basename.slice(index + 1).toLowerCase()
}

export const getFileIcon = (item: FileMentionItem) => {
	if (item.file_kind === 'directory') return Folder

	const extension = getFileExtension(item.path)

	if (
		['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cc', 'cpp', 'h', 'hpp', 'sh', 'rb'].includes(
			extension
		)
	) {
		return FileCode2
	}

	if (['json', 'jsonl'].includes(extension)) {
		return FileJson2
	}

	if (['md', 'mdx', 'txt', 'rst'].includes(extension)) {
		return FileText
	}

	if (['csv', 'tsv', 'xlsx', 'xls'].includes(extension)) {
		return FileSpreadsheet
	}

	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(extension)) {
		return FileImage
	}

	if (['zip', 'tar', 'gz', 'tgz', '7z'].includes(extension)) {
		return FileArchive
	}

	return File
}

export const getSkillTypeLabel = (value: string) =>
	skill_type_label_map[value as keyof typeof skill_type_label_map] || 'Personal'

export const getMentionQueryTerms = (query: string) =>
	query
		.trim()
		.toLowerCase()
		.split(/[\/\s]+/)
		.map(item => item.trim())
		.filter(Boolean)

export const matchesOrderedTerms = (value: string, terms: Array<string>) => {
	let index = 0

	for (const term of terms) {
		const found_index = value.indexOf(term, index)

		if (found_index === -1) {
			return false
		}

		index = found_index + term.length
	}

	return true
}

export const matchesMentionQuery = (item: MentionItem, query: string) => {
	const normalized_query = query.trim().toLowerCase()

	if (!normalized_query) {
		return true
	}

	if (item.type === 'file') {
		return matchesOrderedTerms(item.path.toLowerCase(), getMentionQueryTerms(query))
	}

	return getMentionQueryTerms(query).every(term => item.search_text.includes(term))
}

export const filterMentionItems = (items: Array<MentionItem>, query: string) => {
	const normalized_query = query.trim().toLowerCase()

	if (!normalized_query) {
		return items.slice(0, mention_limit)
	}

	return items.filter(item => matchesMentionQuery(item, query)).slice(0, mention_limit)
}

export const getMentionHeading = (active_mention: ActiveMention | null) =>
	active_mention?.trigger === '/' ? 'Tools & Skills' : 'Mentions'

export const getMentionSections = (
	active_mention: ActiveMention | null,
	items: Array<MentionItem>
): Array<MentionSection> => {
	const agent_items = items.filter((item): item is AgentMentionItem => item.type === 'agent')
	const file_items = items.filter((item): item is FileMentionItem => item.type === 'file')
	const skill_items = items.filter((item): item is SkillMentionItem => item.type === 'skill')
	const tool_items = items.filter((item): item is ToolMentionItem => item.type === 'tool')

	if (active_mention?.trigger === '@') {
		return [
			...(agent_items.length
				? ([{ key: 'agents', items: agent_items }] satisfies Array<MentionSection>)
				: []),
			...(file_items.length ? ([{ key: 'files', items: file_items }] satisfies Array<MentionSection>) : [])
		]
	}

	return [
		...(tool_items.length ? ([{ key: 'tools', items: tool_items }] satisfies Array<MentionSection>) : []),
		...(skill_items.length ? ([{ key: 'skills', items: skill_items }] satisfies Array<MentionSection>) : [])
	]
}

export const formatMentionToken = (item: MentionItem) => {
	if (item.type === 'skill') return `[SKILL: ${item.label}]`
	if (item.type === 'tool') return `[TOOL: ${item.label}]`
	if (item.type === 'agent') return `[AGENT: ${item.label}]`

	return `[FILE: ${item.path}]`
}

const hasValidMentionPrefix = (instance: TiptapEditor, from: number) => {
	const prefix = instance.state.doc.textBetween(Math.max(0, from - 1), from, '\n', '\0')

	return prefix === '' || /\s|[([{:;,]/.test(prefix)
}

export const getActiveMentionFromEditor = (instance: TiptapEditor | null) => {
	if (!instance) return null

	const { $from } = instance.state.selection
	let slash_match = findSuggestionMatch({
		char: '/',
		$position: $from,
		startOfLine: false,
		allowSpaces: false,
		allowedPrefixes: null,
		allowToIncludeChar: false
	})
	const at_match = findSuggestionMatch({
		char: '@',
		$position: $from,
		startOfLine: false,
		allowSpaces: false,
		allowedPrefixes: null,
		allowToIncludeChar: false
	})

	if (slash_match && !hasValidMentionPrefix(instance, slash_match.range.from)) {
		slash_match = null
	}

	const valid_at_match = at_match && hasValidMentionPrefix(instance, at_match.range.from) ? at_match : null

	const slash_inside_at =
		!!slash_match &&
		!!valid_at_match &&
		valid_at_match.range.from <= slash_match.range.from &&
		valid_at_match.range.to >= slash_match.range.to
	const match = slash_inside_at
		? valid_at_match
		: [slash_match, valid_at_match]
				.filter(Boolean)
				.sort((a, b) => (b?.range.from ?? 0) - (a?.range.from ?? 0))[0]

	if (!match) return null

	return {
		trigger: match.text[0] as ActiveMention['trigger'],
		query: match.query,
		start: match.range.from,
		end: match.range.to
	} satisfies ActiveMention
}

export const getMentionInsertContent = (item: MentionItem) => {
	if (item.type === 'tool') {
		return {
			type: 'sessionToken',
			attrs: {
				tokenType: 'tool',
				label: item.label,
				refStart: null,
				refEnd: null
			} satisfies SessionTokenAttrs
		}
	}

	if (item.type === 'skill') {
		return {
			type: 'sessionToken',
			attrs: {
				tokenType: 'skill',
				label: item.label,
				refStart: null,
				refEnd: null
			} satisfies SessionTokenAttrs
		}
	}

	if (item.type === 'agent') {
		return {
			type: 'sessionToken',
			attrs: {
				tokenType: 'agent',
				label: item.label,
				refStart: null,
				refEnd: null
			} satisfies SessionTokenAttrs
		}
	}

	return {
		type: 'sessionToken',
		attrs: {
			tokenType: 'file',
			label: item.path,
			refStart: null,
			refEnd: null
		} satisfies SessionTokenAttrs
	}
}

export const createSkillItems = (
	items: Array<{ id: string; name: string; desc?: string; path: string; type?: string | null }>
) => {
	const builtin_map = new Map(
		builtin_system_skills.map(item => [
			item.label,
			{
				...item,
				type: 'skill' as const,
				path: `builtin://${item.label}`,
				skill_type: 'system',
				search_text: `${item.label} ${item.desc}`.toLowerCase()
			}
		])
	)

	for (const item of items) {
		builtin_map.set(item.name, {
			key: item.id,
			type: 'skill' as const,
			label: item.name,
			desc: item.desc || '',
			path: item.path,
			skill_type: builtin_map.has(item.name) ? 'system' : item.type || '',
			search_text: `${item.name} ${item.desc || ''} ${item.path || ''}`.toLowerCase()
		})
	}

	return Array.from(builtin_map.values())
}
