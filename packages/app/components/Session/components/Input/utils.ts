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
import type { TFunction } from 'i18next'
import type {
	ActiveMention,
	AgentMentionItem,
	FileMentionItem,
	McpMentionItem,
	MentionItem,
	MentionSection,
	SessionTokenAttrs,
	SkillMentionItem,
	ToolMentionItem
} from './types'

type Translate = TFunction<'components'>

export const getSubmitModes = (t: Translate) => [
	{ label: String(t('session.input.submit_enter')), value: 'enter' },
	{ label: String(t('session.input.submit_ctrl_enter')), value: 'ctrl+enter' }
]

export const getSessionModes = (t: Translate) => [
	{ label: String(t('session.input.mode_normal')), value: 'normal' },
	{ label: String(t('session.input.mode_plan')), value: 'plan' },
	{ label: String(t('session.input.mode_plan_exec')), value: 'plan-exec' }
]

export const getAuditModes = (t: Translate) => [
	{ label: String(t('session.input.audit_limited')), value: 'limited' },
	{ label: String(t('session.input.audit_auto')), value: 'auto' },
	{ label: String(t('session.input.audit_full')), value: 'full' }
]

export const getEffortModes = (t: Translate) => [
	{ label: String(t('session.input.effort_default')), value: 'default' },
	{ label: String(t('session.input.effort_low')), value: 'low' },
	{ label: String(t('session.input.effort_medium')), value: 'medium' },
	{ label: String(t('session.input.effort_high')), value: 'high' },
	{ label: String(t('session.input.effort_xhigh')), value: 'xhigh' }
]

const mention_limit = 50
export const getBuiltinSystemSkills = (t: Translate) =>
	[
		{
			key: 'builtin-skill-creator',
			label: String(t('session.skill.creator_label')),
			desc: String(t('session.skill.creator_desc'))
		},
		{
			key: 'builtin-skill-installer',
			label: String(t('session.skill.installer_label')),
			desc: String(t('session.skill.installer_desc'))
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

export const getSkillTypeLabel = (args: { value: string; t: Translate }) => {
	const { value, t } = args

	return value === 'system' ? String(t('session.skill.system')) : String(t('session.skill.personal'))
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getMentionQueryTerms = (query: string) =>
	query
		.trim()
		.split(/[\/\s]+/)
		.map(item => item.trim())
		.filter(Boolean)

const findCaseInsensitiveIndex = (value: string, term: string, from: number) => {
	const match = value.slice(from).match(new RegExp(escapeRegex(term), 'i'))

	return match?.index === undefined ? -1 : from + match.index
}

export const matchesOrderedTerms = (value: string, terms: Array<string>) => {
	let index = 0

	for (const term of terms) {
		const found_index = findCaseInsensitiveIndex(value, term, index)

		if (found_index === -1) {
			return false
		}

		index = found_index + term.length
	}

	return true
}

export const matchesMentionQuery = (item: MentionItem, query: string) => {
	const normalized_query = query.trim()

	if (!normalized_query) {
		return true
	}

	if (item.type === 'file') {
		return matchesOrderedTerms(item.path, getMentionQueryTerms(query))
	}

	return getMentionQueryTerms(query).every(term => new RegExp(escapeRegex(term), 'i').test(item.search_text))
}

export const filterMentionItems = (items: Array<MentionItem>, query: string) => {
	const normalized_query = query.trim()

	if (!normalized_query) {
		return items.slice(0, mention_limit)
	}

	return items.filter(item => matchesMentionQuery(item, query)).slice(0, mention_limit)
}

export const getMentionHeading = (args: { active_mention: ActiveMention | null; t: Translate }) => {
	const { active_mention, t } = args

	return active_mention?.trigger === '/' ? t('session.mention.tools_mcps_skills') : t('session.mention.mentions')
}

export const getMentionSections = (
	active_mention: ActiveMention | null,
	items: Array<MentionItem>
): Array<MentionSection> => {
	const agent_items = items.filter((item): item is AgentMentionItem => item.type === 'agent')
	const file_items = items.filter((item): item is FileMentionItem => item.type === 'file')
	const mcp_items = items.filter((item): item is McpMentionItem => item.type === 'mcp')
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
		...(mcp_items.length ? ([{ key: 'mcps', items: mcp_items }] satisfies Array<MentionSection>) : []),
		...(skill_items.length ? ([{ key: 'skills', items: skill_items }] satisfies Array<MentionSection>) : [])
	]
}

export const formatMentionToken = (item: MentionItem) => {
	if (item.type === 'skill') return `[SKILL: ${item.label}]`
	if (item.type === 'tool') return `[TOOL: ${item.label}]`
	if (item.type === 'mcp') return `[MCP: ${item.label}]`
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

	if (item.type === 'mcp') {
		return {
			type: 'sessionToken',
			attrs: {
				tokenType: 'mcp',
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

export const createSkillItems = (args: {
	items: Array<{ id: string; name: string; desc?: string; path: string; type?: string | null }>
	t: Translate
}) => {
	const { items, t } = args
	const builtin_map = new Map<string, SkillMentionItem>(
		getBuiltinSystemSkills(t).map(item => [
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
