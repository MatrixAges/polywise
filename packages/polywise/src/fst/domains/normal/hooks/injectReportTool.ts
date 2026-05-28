import { createReportTool } from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default (s: Session, state: ToolState) => {
	if (!state.hasTodo || !state.reportEnabled) {
		return state
	}

	state.extra = {
		...(state.extra || {}),
		report_tool: createReportTool(s)
	}
	state.hasReportTool = true

	return state
}
