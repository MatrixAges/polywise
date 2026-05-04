import type { Message, MessageMetadata } from '@core/fst'

export const getReasoningDuration = (message: Message, index: number) => {
	const metadata = message.metadata as MessageMetadata | undefined
	const part = message.parts[index]

	if (!metadata?.reasoning_duration || part?.type !== 'reasoning') return

	const reasoning_parts = message.parts.slice(0, index + 1).filter(part => part.type === 'reasoning')
	const reasoning_index = reasoning_parts.length - 1

	return Object.values(metadata.reasoning_duration)[reasoning_index]
}
