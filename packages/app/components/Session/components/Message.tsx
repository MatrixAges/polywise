import { useMemo } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { Message, MessageContent } from '@/__shadcn__/components/ai-elements'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/__shadcn__/components/ui/collapsible'
import { cn } from '@/__shadcn__/lib/utils'
import { getDurationTime } from '@/utils/time'

import LoadingDots from './LoadingDots'
import Part from './Part'
import SourceUrls from './SourceUrls'

import type { MessagePartDurationUIPart, Message as SessionMessage } from '@core/fst'
import type { FileUIPart, SourceUrlUIPart } from 'ai'
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
			type: 'content'
			items: Array<PartWithDuration>
	  }
	| {
			type: 'process'
			items: Array<PartWithDuration>
			duration: number
			defaultOpen: boolean
	  }

const isPartDurationPart = (part: SessionMessage['parts'][number] | undefined): part is MessagePartDurationUIPart => {
	return part?.type === 'data-part-duration'
}

const isTextPart = (part: PartWithDuration) => part.part.type === 'text'

const getTargetTypeFromPart = (part: DurationAwarePart) => {
	if (part.type === 'text' || part.type === 'reasoning' || part.type === 'dynamic-tool') return part.type

	return part.type
}

const getWorkedForLabel = (duration: number) => {
	if (duration <= 0) return 'Worked for a moment'

	return `Worked for ${getDurationTime(duration)}`
}

const getProcessBlocks = (items: Array<PartWithDuration>) => {
	const blocks = [] as Array<Array<PartWithDuration>>
	let current_block = [] as Array<PartWithDuration>
	let current_block_has_text = false

	items.forEach(item => {
		if (isTextPart(item) && current_block.length > 0 && current_block_has_text) {
			blocks.push(current_block)
			current_block = []
			current_block_has_text = false
		}

		current_block.push(item)

		if (isTextPart(item)) {
			current_block_has_text = true
		}
	})

	if (current_block.length > 0) {
		blocks.push(current_block)
	}

	return blocks
}

const getRenderBlocks = (items: Array<PartWithDuration>, streaming: boolean) => {
	const trailing_text_items = [] as Array<PartWithDuration>
	let split_index = items.length

	for (let index = items.length - 1; index >= 0; index -= 1) {
		const item = items[index]

		if (!isTextPart(item)) break

		trailing_text_items.unshift(item)
		split_index = index
	}

	const has_final_content = trailing_text_items.length > 0
	const process_items = has_final_content ? items.slice(0, split_index) : items
	const process_blocks = getProcessBlocks(process_items)
	const blocks = process_blocks.map((block, index) => ({
		type: 'process' as const,
		items: block,
		duration: block.reduce((total, item) => total + (item.duration ?? 0), 0),
		defaultOpen: !has_final_content && streaming && index === process_blocks.length - 1
	})) as Array<RenderBlock>

	if (has_final_content) {
		blocks.push({
			type: 'content',
			items: trailing_text_items
		})
	}

	return blocks satisfies Array<RenderBlock>
}

const ProcessBlock = (props: {
	defaultOpen: boolean
	duration: number
	items: Array<PartWithDuration>
	messageId: string
	streaming: boolean
	answer: IPropsMessage['answer']
}) => {
	const { defaultOpen, duration, items, messageId, streaming, answer } = props

	return (
		<Collapsible className='group/process w-full' defaultOpen={defaultOpen}>
			<CollapsibleTrigger
				className='
					flex
					items-center
					w-full
					gap-1.5
					text-std-300 text-sm
					text-left
					transition-colors
					hover:text-std-400
				'
			>
				<span>{getWorkedForLabel(duration)}</span>
				<ChevronDownIcon
					className='
						size-4
						transition-transform
						group-data-open/process:rotate-180
					'
				></ChevronDownIcon>
			</CollapsibleTrigger>
			<CollapsibleContent
				className='
					pt-2
					mt-1
					border-border-light border-t
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

const Index = (props: IPropsMessage) => {
	const { streaming, message, answer } = props
	const { parts } = message

	const { source_urls, files, render_blocks } = useMemo(() => {
		const source_urls = [] as Array<SourceUrlUIPart>
		const files = [] as Array<FileUIPart>
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
			} else if (part.type === 'file') {
				files.push(part)
			} else {
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
			files,
			render_blocks: getRenderBlocks(left_parts, streaming)
		}
	}, [parts, streaming])

	return (
		<Message from={message.role}>
			<MessageContent>
				{render_blocks.length
					? render_blocks.map((block, index) =>
							block.type === 'process' ? (
								<ProcessBlock
									defaultOpen={block.defaultOpen}
									duration={block.duration}
									items={block.items}
									messageId={`${message.id}-${index}-${block.defaultOpen ? 'open' : 'closed'}`}
									streaming={streaming}
									answer={answer}
									key={`${message.id}-process-${index}-${block.defaultOpen ? 'open' : 'closed'}`}
								></ProcessBlock>
							) : (
								<div
									className={cn('flex flex-col gap-3')}
									key={`${message.id}-content-${index}`}
								>
									{block.items.map(({ part, duration }, item_index) => (
										<Part
											streaming={
												streaming &&
												item_index === block.items.length - 1
											}
											part={part}
											duration={duration}
											answer={answer}
											key={`${message.id}-content-${index}-${item_index}`}
										></Part>
									))}
								</div>
							)
						)
					: streaming && <LoadingDots></LoadingDots>}
				{source_urls.length > 0 && <SourceUrls items={source_urls}></SourceUrls>}
			</MessageContent>
		</Message>
	)
}

export default $app.memo(Index)
