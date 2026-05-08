import { useMemo } from 'react'

import { Message, MessageContent } from '@/__shadcn__/components/ai-elements'

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

const isPartDurationPart = (part: SessionMessage['parts'][number] | undefined): part is MessagePartDurationUIPart => {
	return part?.type === 'data-part-duration'
}

const getTargetTypeFromPart = (part: DurationAwarePart) => {
	if (part.type === 'text' || part.type === 'reasoning' || part.type === 'dynamic-tool') return part.type

	return part.type
}

const Index = (props: IPropsMessage) => {
	const { streaming, message, answer } = props
	const { parts } = message

	const { source_urls, files, left_parts } = useMemo(() => {
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

		return { source_urls, files, left_parts }
	}, [parts])

	return (
		<Message from={message.role}>
			<MessageContent>
				{left_parts.length
					? left_parts.map(({ part, duration }, index) => (
							<Part
								streaming={index === left_parts.length - 1 && streaming}
								part={part}
								duration={duration}
								answer={answer}
								key={`${message.id}-${index}`}
							></Part>
						))
					: streaming && <LoadingDots></LoadingDots>}
				{source_urls.length > 0 && <SourceUrls items={source_urls}></SourceUrls>}
			</MessageContent>
		</Message>
	)
}

export default $app.memo(Index)
