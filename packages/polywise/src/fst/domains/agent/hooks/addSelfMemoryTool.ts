import { createSelfMemoryTool } from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default (s: Session, state: ToolState) => {
	state.extra = {
		...(state.extra || {}),
		self_memory_tool: createSelfMemoryTool(s)
	}

	return state
}
