import { useMemo } from 'react'

import { Message, MessageContent } from '@/__shadcn__/components/ai-elements'

import LoadingDots from './LoadingDots'
import Part from './Part'
import SourceUrls from './SourceUrls'

import type { MessageMetadata } from '@core/fst'
import type { FileUIPart, SourceUrlUIPart, TextUIPart } from 'ai'
import type { IPropsMessage } from '../types'

const Index = (props: IPropsMessage) => {
	const { streaming, message } = props
	const { parts } = message

	const { source_urls, files, left_parts } = useMemo(() => {
		const source_urls = [] as Array<SourceUrlUIPart>
		const files = [] as Array<FileUIPart>
		const left_parts = [] as Array<TextUIPart>

		parts.forEach(part => {
			if (part.type === 'source-url') {
				source_urls.push(part)
			} else if (part.type === 'file') {
				files.push(part)
			} else {
				left_parts.push(part as TextUIPart)
			}
		})

		return { source_urls, files, left_parts }
	}, [parts])

	return (
		<Message from={message.role} key={message.id}>
			<MessageContent>
				{left_parts.length ? (
					left_parts.map((part, index) => (
						<Part
							streaming={streaming}
							part={part}
							metadata={message.metadata as MessageMetadata}
							key={`${message.id}-${index}`}
						></Part>
					))
				) : (
					<LoadingDots></LoadingDots>
				)}
				{source_urls.length > 0 && <SourceUrls items={source_urls}></SourceUrls>}
			</MessageContent>
		</Message>
	)
}

export default $app.memo(Index)
