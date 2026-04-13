import { stepCountIs, ToolLoopAgent } from 'ai'

import { createSkillTool } from '../../tools'
import { createMemoryTool } from './memory_tool'
import { createWikiTool } from './wiki_tool'

import type { LanguageModel } from 'ai'
import type Session from '../../session'
import type { ScopeInfo } from './types'

export default (model: LanguageModel, session: Session, scope: ScopeInfo, system: string) => {
	return new ToolLoopAgent({
		model,
		instructions: system,
		tools: {
			memory_tool: createMemoryTool(scope),
			wiki_tool: createWikiTool(scope),
			skill_tool: createSkillTool(session)
		},
		stopWhen: stepCountIs(20)
	})
}
