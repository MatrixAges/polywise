import { useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'
import dayjs from 'dayjs'
import { ChevronRightIcon, Copy, Trash2 } from 'lucide-react'

import { Message, MessageContent } from '@/__shadcn__/components/ai-elements'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/__shadcn__/components/ui/collapsible'
import { copy, formatDateTime, formatTime } from '@/utils'
import getToolIcon from '@/utils/getToolIcon'

import LoadingDots from './LoadingDots'
import Part from './Part'
import SourceUrls from './SourceUrls'

import type { MessagePartDurationUIPart, Message as SessionMessage } from '@core/fst'
import type { FileUIPart, SourceUrlUIPart, ToolUIPart } from 'ai'
import type { IPropsMessage } from '../types'

type DurationAwarePart = Exclude<
	SessionMessage['parts'][number],
	MessagePartDurationUIPart | SourceUrlUIPart | FileUIPart
>
type PartWithDuration = {
	part: DurationAwarePart
	duration?: number
}
type RenderBlock =
	| {
			type: 'part'
			item: PartWithDuration
	  }
	| {
			type: 'tools'
			items: Array<PartWithDuration>
			summary: string
	  }
	| {
			type: 'active-tool'
			item: PartWithDuration
	  }

const isPartDurationPart = (part: SessionMessage['parts'][number] | undefined): part is MessagePartDurationUIPart => {
	return part?.type === 'data-part-duration'
}

const getTargetTypeFromPart = (part: DurationAwarePart) => {
	if (part.type === 'text' || part.type === 'reasoning' || part.type === 'dynamic-tool') return part.type

	return part.type
}

const hidden_tool_types = new Set(['tool-context_tool', 'tool-report_tool'])

const isHiddenToolPart = (part: DurationAwarePart) => hidden_tool_types.has(part.type)

const isToolPart = (part: DurationAwarePart) => part.type === 'dynamic-tool' || part.type.startsWith('tool-')

const isRenderablePart = (part: DurationAwarePart) =>
	part.type === 'text' || part.type === 'reasoning' || isToolPart(part)

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
	`${count} ${count === 1 ? singular : plural}`

const getToolSummaryCategory = (part: DurationAwarePart) => {
	switch (part.type) {
		case 'tool-read_file_tool':
			return 'file'
		case 'tool-search_file_tool':
		case 'tool-web_search_tool':
			return 'search'
		case 'tool-glob_tool':
			return 'list'
		case 'tool-web_fetch_tool':
			return 'fetch'
		case 'tool-bash_tool':
			return 'command'
		case 'tool-edit_file_tool':
		case 'tool-write_file_tool':
			return 'edit'
		case 'dynamic-tool':
			return 'tool'
		default:
			return 'tool'
	}
}

const getToolsSummary = (items: Array<PartWithDuration>) => {
	const counts = {
		file: 0,
		search: 0,
		list: 0,
		fetch: 0,
		command: 0,
		edit: 0,
		tool: 0
	}

	items.forEach(item => {
		counts[getToolSummaryCategory(item.part)] += 1
	})

	const explored = [
		counts.file ? pluralize(counts.file, 'file') : '',
		counts.search ? pluralize(counts.search, 'search', 'searches') : '',
		counts.list ? pluralize(counts.list, 'list') : '',
		counts.fetch ? pluralize(counts.fetch, 'fetch', 'fetches') : ''
	].filter(Boolean)
	const actions = [
		counts.command ? `Ran ${pluralize(counts.command, 'command')}` : '',
		counts.edit ? `Made ${pluralize(counts.edit, 'edit')}` : '',
		counts.tool ? `Used ${pluralize(counts.tool, 'tool')}` : ''
	].filter(Boolean)

	if (explored.length > 0 && actions.length > 0) {
		return `Explored ${explored.join(', ')}, ${actions.join(', ')}`
	}

	if (explored.length > 0) return `Explored ${explored.join(', ')}`

	if (actions.length > 0) return actions.join(', ')

	return 'Used tools'
}

const getRenderBlocks = (items: Array<PartWithDuration>, streaming: boolean) => {
	const blocks = [] as Array<RenderBlock>
	let current_tool_group = [] as Array<PartWithDuration>

	const flushToolGroup = (show_active_tool = false) => {
		if (current_tool_group.length === 0) return

		if (show_active_tool) {
			blocks.push({
				type: 'active-tool',
				item: current_tool_group[current_tool_group.length - 1]
			})
			current_tool_group = []
			return
		}

		blocks.push({
			type: 'tools',
			items: current_tool_group,
			summary: getToolsSummary(current_tool_group)
		})

		current_tool_group = []
	}

	items.forEach(item => {
		if (isHiddenToolPart(item.part)) return

		if (isToolPart(item.part)) {
			current_tool_group.push(item)
			return
		}

		flushToolGroup()
		blocks.push({
			type: 'part',
			item
		})
	})

	flushToolGroup(streaming)

	return blocks
}

const getBlockDuration = (block: RenderBlock) => {
	if (block.type === 'part') return block.item.duration ?? 0
	if (block.type === 'active-tool') return block.item.duration ?? 0

	return block.items.reduce((total, item) => total + (item.duration ?? 0), 0)
}

const formatDuration = (duration: number) => {
	const total_seconds = Math.max(0, Math.round(duration / 1000))

	if (total_seconds < 60) return `${total_seconds}s`

	const minutes = Math.floor(total_seconds / 60)
	const seconds = total_seconds % 60

	if (minutes < 60) {
		return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
	}

	const hours = Math.floor(minutes / 60)
	const rest_minutes = minutes % 60

	if (rest_minutes === 0 && seconds === 0) return `${hours}h`
	if (seconds === 0) return `${hours}h ${rest_minutes}m`

	return `${hours}h ${rest_minutes}m ${seconds}s`
}

const getMessageCopyText = (message: SessionMessage) => {
	return message.parts
		.map(part => {
			if (part.type === 'text' || part.type === 'reasoning') return part.text
			if (part.type === 'source-url') return part.url

			return ''
		})
		.filter(Boolean)
		.join('\n\n')
		.trim()
}

const formatMessageTime = (created_at?: Date) => {
	if (!created_at) return ''

	return dayjs(created_at).isSame(dayjs(), 'day')
		? formatTime(created_at, 'HH:mm:ss')
		: formatDateTime(created_at, 'YYYY-MM-DD HH:mm:ss')
}

const ToolSummaryBlock = (props: {
	items: Array<PartWithDuration>
	messageId: string
	streaming: boolean
	summary: string
	answer: IPropsMessage['answer']
}) => {
	const { items, messageId, streaming, summary, answer } = props
	const last_tool_part = items[items.length - 1]?.part
	const SummaryIcon = last_tool_part ? getToolIcon(last_tool_part) : null

	return (
		<Collapsible className='group/process mb-0! w-full'>
			<CollapsibleTrigger
				className='
					flex
					items-center
					w-full
					gap-1.5
					text-std-400 text-sm
					text-left
					transition-colors
					hover:text-std-700
				'
			>
				<div className='flex min-w-0 items-center gap-1.5'>
					{SummaryIcon && <SummaryIcon className='text-std-400 size-3.5 shrink-0' />}
					<span>{summary}</span>
					<ChevronRightIcon
						className='
							shrink-0
							size-4
							opacity-0
							transition-[transform,opacity]
							group-hover/process:opacity-100 group-data-open/process:rotate-90 group-data-open/process:opacity-100
						'
					></ChevronRightIcon>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent
				className='
					pt-2
					mt-1.5
					data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1
				'
			>
				<div className='flex flex-col gap-1'>
					{items.map(({ part, duration: part_duration }, index) => (
						<Part
							streaming={streaming && index === items.length - 1}
							part={part}
							duration={part_duration}
							answer={answer}
							key={`${messageId}-process-${index}`}
						></Part>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

const ProcessSummaryBlock = (props: { children: React.ReactNode; duration: number }) => {
	const { children, duration } = props

	return (
		<Collapsible className='group/process-summary mb-0! w-full'>
			<CollapsibleTrigger
				className='
					flex
					items-center
					w-full
					gap-1.5
					text-std-400 text-sm
					text-left
					transition-colors
					hover:text-std-700
				'
			>
				<span>Worked for {formatDuration(duration)}</span>
				<ChevronRightIcon
					className='
						size-4
						transition-transform
						group-data-open/process-summary:rotate-90
					'
				></ChevronRightIcon>
			</CollapsibleTrigger>
			<CollapsibleContent
				className='
					pt-2.5
					mt-1.5
					border-border-light border-t
					data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1
				'
			>
				<div className='flex flex-col gap-3'>{children}</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

const Index = (props: IPropsMessage) => {
	const { streaming, is_streaming, message, answer, removeMessage } = props
	const { parts } = message
	const copy_text = useMemo(() => getMessageCopyText(message), [message])
	const created_at_text = useMemo(() => formatMessageTime(message.createdAt), [message.createdAt])

	const { source_urls, render_blocks } = useMemo(() => {
		const source_urls = [] as Array<SourceUrlUIPart>
		const left_parts = [] as Array<PartWithDuration>
		const pending_part_indexes = new Map<string, Array<number>>()

		parts.forEach(part => {
			if (isPartDurationPart(part)) {
				const queue = pending_part_indexes.get(part.data.targetType)
				const target_index = queue?.shift()

				if (target_index !== undefined) {
					left_parts[target_index].duration = part.data.duration
				}

				return
			}

			if (part.type === 'source-url') {
				source_urls.push(part)
			} else {
				if (!isRenderablePart(part as DurationAwarePart)) return

				const target_type = getTargetTypeFromPart(part as DurationAwarePart)
				const queue = pending_part_indexes.get(target_type) ?? []

				left_parts.push({
					part: part as DurationAwarePart
				})

				queue.push(left_parts.length - 1)
				pending_part_indexes.set(target_type, queue)
			}
		})

		return {
			source_urls,
			render_blocks: getRenderBlocks(left_parts, streaming)
		}
	}, [parts, streaming])

	const onCopy = useMemoizedFn(() => {
		if (!copy_text) return

		void copy(copy_text)
	})

	const onRemove = useMemoizedFn(() => {
		void removeMessage(message.id)
	})

	const renderBlock = (block: RenderBlock, index: number, total_blocks: number) => {
		return block.type === 'tools' ? (
			<ToolSummaryBlock
				items={block.items}
				summary={block.summary}
				messageId={`${message.id}-${index}-summary`}
				streaming={streaming}
				answer={answer}
				key={`${message.id}-process-${index}-summary`}
			></ToolSummaryBlock>
		) : block.type === 'active-tool' ? (
			<Part
				streaming={streaming && index === total_blocks - 1}
				part={block.item.part}
				duration={block.item.duration}
				answer={answer}
				key={`${message.id}-active-tool-${index}`}
			></Part>
		) : (
			<Part
				streaming={streaming && index === total_blocks - 1}
				part={block.item.part}
				duration={block.item.duration}
				answer={answer}
				key={`${message.id}-part-${index}`}
			></Part>
		)
	}

	const first_text_block_index = render_blocks.findIndex(
		block => block.type === 'part' && block.item.part.type === 'text'
	)
	const has_final_output = first_text_block_index > 0
	const process_blocks = has_final_output ? render_blocks.slice(0, first_text_block_index) : []
	const content_blocks = has_final_output ? render_blocks.slice(first_text_block_index) : render_blocks
	const process_duration = process_blocks.reduce((total, block) => total + getBlockDuration(block), 0)

	return (
		<Message from={message.role}>
			<MessageContent>
				{render_blocks.length ? (
					<>
						{has_final_output && process_blocks.length > 0 && (
							<ProcessSummaryBlock duration={process_duration}>
								{process_blocks.map((block, index) =>
									renderBlock(block, index, process_blocks.length)
								)}
							</ProcessSummaryBlock>
						)}
						{content_blocks.map((block, index) =>
							renderBlock(
								block,
								index + (has_final_output ? first_text_block_index : 0),
								content_blocks.length
							)
						)}
					</>
				) : (
					streaming && <LoadingDots></LoadingDots>
				)}
				{source_urls.length > 0 && <SourceUrls items={source_urls}></SourceUrls>}
			</MessageContent>
			{!streaming && (
				<div
					className='
						flex
						items-center
						w-fit
						gap-1
						text-xsm text-std-400
						opacity-0
						transition-opacity
						group-hover:pointer-events-auto group-hover:opacity-100 group-[.is-user]:ml-auto
						pointer-events-none
					'
				>
					{created_at_text && <span className='px-1'>{created_at_text}</span>}
					<button
						className='icon_button small'
						disabled={!copy_text}
						title='Copy message'
						type='button'
						onClick={onCopy}
					>
						<Copy></Copy>
					</button>
					<button
						className='icon_button small'
						disabled={is_streaming}
						title='Delete message'
						type='button'
						onClick={onRemove}
					>
						<Trash2></Trash2>
					</button>
				</div>
			)}
		</Message>
	)
}

export default $app.memo(Index)
