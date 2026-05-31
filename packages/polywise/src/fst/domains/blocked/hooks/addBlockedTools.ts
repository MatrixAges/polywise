import { createPageTool, createPolywiseTool } from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default (_s: Session, state: ToolState) => {
	state.extra = {
		...(state.extra || {}),
		polywise_tool: createPolywiseTool(),
		page_tool: createPageTool()
	}

	return state
}
