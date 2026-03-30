import type { Message, MessageMetadata } from '@core/fst'
import type Model from './model'

export interface IPropsMessage {
	streaming: boolean
	message: Message
}

export interface IPropsPart {
	streaming: boolean
	metadata: MessageMetadata
	part: Message['parts'][number]
}

export interface IPropsInput extends Pick<Model, 'send' | 'stop' | 'clear' | 'scrollToBottom'> {
	streaming: boolean
}
