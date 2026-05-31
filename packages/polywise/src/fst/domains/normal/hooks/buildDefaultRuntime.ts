import { isBlockedSessionId } from '@core/consts'

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

const stripTitleTool = (state: ToolState) => {
	if (!state.runtime?.tools || !('title_tool' in state.runtime.tools)) {
		state.hasTitleTool = false

		return state
	}

	delete state.runtime.tools.title_tool
	state.hasTitleTool = false

	return state
}

export default async (s: Session, state: ToolState) => {
	const should_disable_title_tool = isBlockedSessionId(s.id)

	if (state.runtime) {
		if (should_disable_title_tool) {
			return stripTitleTool(state)
		}

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
			...(should_disable_title_tool ? {} : { title_tool: createTitleTool(s) }),
			skill_tool: createSkillTool(s),
			cron_tool: createCronTool(s),
			error_collect_tool: createErrorCollectTool(),
			...(state.extra || {})
		}
	})
	state.hasTitleTool = !should_disable_title_tool

	return state
}
