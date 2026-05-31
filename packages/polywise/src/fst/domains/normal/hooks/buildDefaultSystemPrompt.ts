import fst_report_tool_prompt from '@core/consts/prompts/fst_report_tool_prompt.md'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import fst_system_tool_prompt from '@core/consts/prompts/fst_system_tool_prompt.md'
import fst_title_tool_prompt from '@core/consts/prompts/fst_title_tool_prompt.md'
import dayjs from 'dayjs'

import getModePrompt from './getModePrompt'

import type Session from '../../../session'
import type { PromptState } from '../../../session/core/types'

export default (s: Session, state: PromptState) => {
	if (state.system) {
		return state
	}

	const runtime = state.tools.runtime as any

	if (!runtime) {
		return state
	}

	const hasTitleTool = state.tools.hasTitleTool || Boolean(runtime?.tools && 'title_tool' in runtime.tools)

	state.system = [
		fst_system_prompt,
		hasTitleTool ? fst_title_tool_prompt : '',
		...state.parts,
		state.tools.hasReportTool ? fst_report_tool_prompt : '',
		runtime.has_system_tool ? fst_system_tool_prompt : '',
		runtime.system_tools_prompt,
		runtime.custom_tools_prompt,
		runtime.skill_prompt,
		runtime.prompt_injection_prompt,
		`Current Session Title: ${s.session.title}`,
		state.tools.hasReportTool ? `Current Session Report: ${s.session.report ?? ''}` : '',
		s.getContextPrompt(),
		getModePrompt(s),
		`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
	]
		.filter(Boolean)
		.join('\n\n')

	return state
}
