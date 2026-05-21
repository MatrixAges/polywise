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

import type { FC } from 'react'

const mention_limit = 50
const skill_type_label_map = {
	system: 'System'
} as const

type MentionTrigger = '/' | '@'

export interface SkillMentionItem {
	key: string
	type: 'skill'
	label: string
	desc: string
	path: string
	skill_type: string
	search_text: string
}

export interface FileMentionItem {
	key: string
	type: 'file'
	label: string
	path: string
	basename: string
	file_kind: 'directory' | 'file'
	search_text: string
}

export type MentionItem = SkillMentionItem | FileMentionItem

export interface ActiveMention {
	trigger: MentionTrigger
	query: string
	start: number
	end: number
}

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

const is_whitespace = (value: string) => /\s/.test(value)

export const getActiveMention = (value: string, cursor: number) => {
	if (cursor < 0) return null

	let segment_start = cursor

	while (segment_start > 0 && !is_whitespace(value[segment_start - 1])) {
		segment_start -= 1
	}

	const segment = value.slice(segment_start, cursor)
	const slash_index = segment.lastIndexOf('/')
	const at_index = segment.lastIndexOf('@')
	const trigger_index = Math.max(slash_index, at_index)

	if (trigger_index === -1) return null

	const trigger = segment[trigger_index] as MentionTrigger

	if (trigger_index > 0) {
		return null
	}

	return {
		trigger,
		query: segment.slice(trigger_index + 1),
		start: segment_start + trigger_index,
		end: cursor
	} satisfies ActiveMention
}

export const filterMentionItems = (items: Array<MentionItem>, query: string) => {
	const normalized_query = query.trim().toLowerCase()

	if (!normalized_query) {
		return items.slice(0, mention_limit)
	}

	return items.filter(item => item.search_text.includes(normalized_query)).slice(0, mention_limit)
}

export const formatMentionToken = (item: MentionItem) =>
	item.type === 'skill' ? `[SKILL: ${item.label}]` : `[FILE: ${item.path}]`

export interface MentionProps {
	activeMention: ActiveMention | null
	items: Array<MentionItem>
	loading: boolean
	activeIndex: number
	onSelect: (item: MentionItem) => void
}

const Mention: FC<MentionProps> = ({ activeMention, items, loading, activeIndex, onSelect }) => (
	<div
		className='
				flex flex-col
				rounded-lg
				bg-background/90
				border border-border-light
			'
	>
		<div
			className='
					flex
					items-center justify-between
					px-3 pt-2
					text-xs
				'
		>
			<span className='text-std-600'>{activeMention?.trigger === '/' ? 'Skills' : 'Files'}</span>
			<span className='text-std-400'>{activeMention?.query || 'Type to search'}</span>
		</div>
		<div
			className='
					overflow-y-auto
					flex flex-col
					max-h-56
					gap-0.5
					p-1
				'
		>
			{loading ? (
				<div className='text-std-400 px-3 py-2 text-sm'>Loading...</div>
			) : items.length > 0 ? (
				items.map((item, index) => (
					<button
						className={$cx(
							`
									flex flex-col
									w-full
									py-1
									pl-2.5 pr-1
									rounded-full
									text-left
									hover:bg-accent/60
								`,
							index === activeIndex && 'bg-accent/72'
						)}
						key={item.key}
						onMouseDown={e => e.preventDefault()}
						onClick={() => onSelect(item)}
					>
						{item.type === 'file' ? (
							<div
								className='
											flex
											items-center
											min-w-0
											gap-2
											px-1 py-0.5
										'
							>
								{(() => {
									const Icon = getFileIcon(item)

									return <Icon size={13} />
								})()}
								<span className='shrink-0 truncate text-sm font-medium'>
									{item.basename}
								</span>
								<span className='text-std-400 truncate text-xs'>{item.path}</span>
							</div>
						) : (
							<div
								className='
											flex
											items-center
											w-full
											min-w-0
											gap-2
										'
							>
								<Container size={14} />
								<span className='shrink-0 truncate text-sm font-medium'>
									{item.label}
								</span>
								<span className='text-std-400 flex-1 truncate text-xs'>
									{item.desc || 'No description'}
								</span>
								<span
									className='
												shrink-0
												px-2 py-0.5
												rounded-full
												text-[10px] text-std-500
												border border-border-light
											'
								>
									{getSkillTypeLabel(item.skill_type)}
								</span>
							</div>
						)}
					</button>
				))
			) : (
				<div className='text-std-400 px-3 py-2 text-sm'>No matches found.</div>
			)}
		</div>
	</div>
)

export default Mention
