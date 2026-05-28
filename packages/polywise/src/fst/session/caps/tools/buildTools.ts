import { config } from '@core/config'

import runHooks from '../../hooks/runHooks'

import type { Message } from '../../../types'
import type { ToolState } from '../../core/types'
import type Session from '../../index'

export default async (s: Session, message: Message, isFirst: boolean) =>
	runHooks(s, 'onTools', {
		message,
		isFirst,
		hasTodo: await s.has_todo_session_link,
		reportEnabled: config.report?.enabled !== false,
		extra: {},
		runtime: null,
		hasReportTool: false,
		hasTitleTool: false,
		linkedPost: null
	} satisfies ToolState)
