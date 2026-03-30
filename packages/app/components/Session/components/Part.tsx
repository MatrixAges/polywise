import { MessageResponse } from '@/__shadcn__/components/ai-elements'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/__shadcn__/components/ai-elements/reasoning'

import type { IPropsPart } from '../types'

const Index = (props: IPropsPart) => {
	const { streaming, metadata, part } = props
	const { type } = part

	switch (type) {
		case 'reasoning':
			return (
				<Reasoning
					className='w-full'
					isStreaming={streaming}
					duration={parseInt(((metadata?.reasoning_duration || 0) / 1000).toFixed(0))}
				>
					<ReasoningTrigger />
					<ReasoningContent>{part.text}</ReasoningContent>
				</Reasoning>
			)
		case 'text':
			return <MessageResponse isAnimating>{part.text}</MessageResponse>
	}

	return null
}

export default $app.memo(Index)
