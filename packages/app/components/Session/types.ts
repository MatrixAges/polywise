import type { Message, MessageMetadata } from '@core/fst'
import type { EditResult, QuestionInput } from '@core/fst/tools'
import type { ToolUIPart } from 'ai'
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

export interface IPropsPermission extends Pick<Model, 'permission' | 'approvePermission'> {}

export interface IPropsSubAgent extends Pick<IPropsPart, 'streaming' | 'answer'> {
	part: ToolUIPart
}

export interface EditFileInput {
	edits: Array<{
		file_path: string
		old_string: string
		new_string: string
	}>
}

export interface IPropsEdit extends Pick<IPropsPart, 'streaming' | 'answer'> {
	input: EditFileInput
	output?: EditResult
}
