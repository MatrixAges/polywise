import {
	buildSharedRuntimeTools,
	createContextTool,
	createCronTool,
	createErrorCollectTool,
	createMessageTool,
	createPlanTool,
	createQuestionTool,
	createSkillTool,
	createTitleTool
} from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default async (s: Session, state: ToolState) => {
	if (state.runtime) {
		state.hasTitleTool = 'title_tool' in (state.runtime.tools || {})

		return state
	}

	state.runtime = await buildSharedRuntimeTools({
		s,
		model_tools: s.model.tools,
		extra_tools: {
			context_tool: createContextTool(s),
			message_tool: createMessageTool(s),
			plan_tool: createPlanTool(s),
			question_tool: createQuestionTool(s.id),
			title_tool: createTitleTool(s),
			skill_tool: createSkillTool(s),
			cron_tool: createCronTool(s),
			error_collect_tool: createErrorCollectTool(),
			...(state.extra || {})
		}
	})
	state.hasTitleTool = true

	return state
}
