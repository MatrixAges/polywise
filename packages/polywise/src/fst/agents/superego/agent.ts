import prompt from '@core/consts/prompts/superego_prompt.md'
import { stepCountIs, ToolLoopAgent } from 'ai'

import { createSkillTool } from '../../tools'
import { createMemoryTool } from './memory_tool'
import { createWikiTool } from './wiki_tool'

import type { LanguageModel } from 'ai'
import type Session from '../../session'
import type { SessionScope } from '../../types'

export default (model: LanguageModel, session: Session, scope: SessionScope) => {
	return new ToolLoopAgent({
		model,
		instructions: prompt,
		tools: {
			memory_tool: createMemoryTool(scope),
			wiki_tool: createWikiTool(scope),
			skill_tool: createSkillTool(session)
		},
		stopWhen: stepCountIs(20)
	})
}
