import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import executeSkillTool from './execute'

import type Session from '../../session'

export { default as loadSkillMap } from './load'
export { default as getSkillPrompt } from '@core/consts/prompts/getSkillPrompt'
export { default as readSkillMap } from './read'
export { default as rebuildSkillMap } from './rebuild'
export { default as scanSkillMap } from './scan'

export const inputSchema = object({
	action: Enum(['search', 'read', 'create', 'update', 'build']).describe(
		'The action to perform. search: find skills by keyword. read: get full skill content. create: write a new skill. update: overwrite an existing skill. build: rebuild the skill_map index.'
	),
	keyword: string()
		.optional()
		.describe('[Required for search] Keywords to search for in skill names and descriptions'),
	skill_name: string().optional().describe('[Required for read] The exact skill name to read'),
	max_results: number().optional().describe('[Only for search] Maximum results to return (default 5)'),
	build_name: string().optional().describe('[Required for create] Skill display name stored in frontmatter'),
	build_description: string()
		.optional()
		.describe('[Required for create/update] Short persuasive description shown in Available Skills'),
	build_content: string().optional().describe('[Required for create/update] Full SKILL.md markdown content')
})

export const createSkillTool = (s: Session) => {
	return tool({
		description: [
			'Search and read local skills from the skills/ directory.',
			'Use action "search" with keywords to find relevant skills by name and description.',
			'Use action "read" with an exact skill_name to get the full SKILL.md content.',
			'Use action "create" to write a new skill to /skills/<skill-name>/SKILL.md.',
			'Use action "update" to overwrite an existing skill after reading it first.',
			'Use action "build" after installing, updating, or removing skills to refresh the index.',
			'',
			'To discover, install, or update skills from the community, use web_fetch_tool',
			'with https://skills.sh/ or https://clawhub.ai/skills to browse the skill directory, or use bash_tool to',
			'clone/install skill packages into the skills/ directory.'
		].join('\n'),
		inputSchema,
		execute: input => executeSkillTool(s, input)
	})
}
