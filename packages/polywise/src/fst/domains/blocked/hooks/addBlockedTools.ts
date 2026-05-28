import { createApiTool, createPageTool } from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default (_s: Session, state: ToolState) => {
	state.extra = {
		...(state.extra || {}),
		api_tool: createApiTool(),
		page_tool: createPageTool()
	}

	return state
}
