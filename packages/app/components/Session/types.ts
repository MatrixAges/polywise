import type { Message, MessageMetadata } from '@core/fst'
import type { QuestionInput } from '@core/fst/tools'
import type Model from './model'

export interface IPropsMessage extends Pick<Model, 'answer'> {
	streaming: boolean
	message: Message
}

export interface IPropsPart extends Pick<IPropsMessage, 'streaming' | 'answer'> {
	metadata: MessageMetadata
	part: Message['parts'][number]
}

export interface IPropsInput extends Pick<Model, 'send' | 'stop' | 'clear' | 'scrollToBottom'> {
	streaming: boolean
	toggleContextModal: () => void
}

export interface IPropsQuestion extends Pick<IPropsPart, 'streaming' | 'answer'> {
	input: QuestionInput
	output?: string
}
