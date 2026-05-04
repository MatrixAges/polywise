import { useMemo } from 'react'

import { Message, MessageContent } from '@/__shadcn__/components/ai-elements'

import LoadingDots from './LoadingDots'
import Part from './Part'
import SourceUrls from './SourceUrls'

import type { MessageMetadata } from '@core/fst'
import type { FileUIPart, ReasoningUIPart, SourceUrlUIPart, TextUIPart } from 'ai'
import type { IPropsMessage } from '../types'

const Index = (props: IPropsMessage) => {
	const { streaming, message, answer } = props
	const { parts } = message
	const reasoning_duration = (message.metadata as MessageMetadata)?.reasoning_duration || []

	const { source_urls, files, left_parts } = useMemo(() => {
		const source_urls = [] as Array<SourceUrlUIPart>
		const files = [] as Array<FileUIPart>
		const left_parts = [] as Array<{
			part: TextUIPart | ReasoningUIPart
			reasoning_duration?: number
		}>
		let reasoning_index = 0

		parts.forEach(part => {
			if (part.type === 'source-url') {
				source_urls.push(part)
			} else if (part.type === 'file') {
				files.push(part)
			} else if (part.type === 'reasoning') {
				left_parts.push({
					part,
					reasoning_duration: reasoning_duration[reasoning_index]
				})

				reasoning_index++
			} else {
				left_parts.push({ part: part as TextUIPart | ReasoningUIPart })
			}
		})

		return { source_urls, files, left_parts }
	}, [parts, reasoning_duration])

	return (
		<Message from={message.role}>
			<MessageContent>
				{left_parts.length
					? left_parts.map(({ part, reasoning_duration }, index) => (
							<Part
								streaming={index === left_parts.length - 1 && streaming}
								part={part}
								reasoning_duration={reasoning_duration}
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
