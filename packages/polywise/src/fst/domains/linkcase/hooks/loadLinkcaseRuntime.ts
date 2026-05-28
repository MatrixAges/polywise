import { createCronTool, createLinkcaseTool } from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default (s: Session, state: ToolState) => {
	state.runtime = {
		tools: {
			linkcase_tool: createLinkcaseTool(s),
			cron_tool: createCronTool(s)
		},
		has_system_tool: false,
		system_tools_prompt: '',
		custom_tools_prompt: '',
		skill_prompt: ''
	}
	state.hasReportTool = false
	state.hasTitleTool = false

	return state
}
