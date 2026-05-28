import { getTitleFocus } from '../../../utils'
import runHooks from '../../hooks/runHooks'

import type { Message } from '../../../types'
import type { PromptState, ToolState } from '../../core/types'
import type Session from '../../index'

export default async (s: Session, message: Message, isFirst: boolean, tools: ToolState) =>
	runHooks(s, 'onPrompt', {
		message,
		isFirst,
		tools,
		parts: [],
		system: '',
		titleFocus: getTitleFocus({ s, message, is_first_message: isFirst }) || ''
	} satisfies PromptState)
