import type { Message, MessageMetadata } from '@core/fst'

export const getReasoningDuration = (message: Message, index: number) => {
	if (!(message.metadata as MessageMetadata)?.reasoning_duration) return

	return Object.values((message.metadata as MessageMetadata).reasoning_duration)[index]
}
