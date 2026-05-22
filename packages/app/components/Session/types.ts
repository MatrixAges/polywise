import type { Message, MessagePartDurationUIPart } from '@core/fst'
import type { EditResult, QuestionInput } from '@core/fst/tools'
import type { ToolUIPart } from 'ai'
import type { IProps } from '.'
import type Model from './model'

type VisibleMessagePart = Exclude<Message['parts'][number], MessagePartDurationUIPart>

export interface IPropsMessage extends Pick<Model, 'answer'> {
	streaming: boolean
	is_streaming?: boolean
	message: Message
	previous_user_message?: Message | null
	group_agents?: Model['group_agents']
	removeMessage?: Model['removeMessage']
}

export interface IPropsPart extends Pick<IPropsMessage, 'streaming' | 'answer'> {
	duration?: number
	part: VisibleMessagePart
}

export interface IPropsInput extends Pick<
	Model,
	'send' | 'stop' | 'clear' | 'archive' | 'unarchive' | 'scrollToBottom' | 'setMode' | 'setAuditMode'
> {
	session_id: string
	type: IProps['type']
	streaming: boolean
	archived: boolean
	mode: 'normal' | 'plan' | 'plan-exec'
	audit_mode: 'limited' | 'auto' | 'full'
	draft_input?: IProps['draft_input']
	show_session_mode_select: boolean
	show_audit_mode_select: boolean
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

export interface IPropsEdit extends Pick<IPropsPart, 'streaming'> {
	output: EditResult
}
