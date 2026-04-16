import { tool } from 'ai'
import { readFile } from 'atomically'
import { enum as Enum, number, object, string } from 'zod'

import { checkPermission } from '../../utils'
import readSkillMap from './read'
import rebuildSkillMap from './rebuild'
import search from './search'

import type Session from '../../session'

export { default as loadSkillMap } from './load'
export { default as getSkillPrompt } from '@core/consts/prompts/getSkillPrompt'
export { default as readSkillMap } from './read'
export { default as rebuildSkillMap } from './rebuild'
export { default as scanSkillMap } from './scan'

export const inputSchema = object({
	action: Enum(['search', 'read', 'build']).describe(
		'The action to perform. search: find skills by keyword. read: get full skill content. build: rebuild the skill_map index.'
	),
	keyword: string()
		.optional()
		.describe('[Required for search] Keywords to search for in skill names and descriptions'),
	skill_name: string().optional().describe('[Required for read] The exact skill name to read'),
	max_results: number().optional().describe('[Only for search] Maximum results to return (default 5)')
})

export const createSkillTool = (s: Session) => {
	return tool({
		description: [
			'Search and read local skills from the skills/ directory.',
			'Use action "search" with keywords to find relevant skills by name and description.',
			'Use action "read" with an exact skill_name to get the full SKILL.md content.',
			'Use action "build" after installing, updating, or removing skills to refresh the index.',
			'',
			'To discover, install, or update skills from the community, use web_fetch_tool',
			'with https://skills.sh/ or https://clawhub.ai/skills to browse the skill directory, or use bash_tool to',
			'clone/install skill packages into the skills/ directory.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'search') {
				if (!input.keyword) {
					return { action: 'search', error: 'keyword is required for search action' }
				}

				const max_results = input.max_results ?? 5
				const skill_map = await readSkillMap(s)
				const results = search(skill_map, input.keyword, max_results)

				if (results.length === 0) {
					return {
						action: 'search',
						keyword: input.keyword,
						results: [],
						count: 0,
						hint: 'No local skills matched. Consider browsing https://skills.sh/ with web_fetch_tool to find community skills.'
					}
				}

				return {
					action: 'search',
					keyword: input.keyword,
					results: results.map(r => ({
						name: r.name,
						description: r.description,
						path: r.path,
						score: r.score
					})),
					count: results.length
				}
			}

			if (input.action === 'read') {
				if (!input.skill_name) {
					return { action: 'read', error: 'skill_name is required for read action' }
				}

				const skill_map = await readSkillMap(s)
				const target = skill_map.find(s => s.name === input.skill_name)

				if (!target) {
					return {
						action: 'read',
						skill_name: input.skill_name,
						content: '',
						error: `Skill "${input.skill_name}" not found in skill_map. Use action "search" to find available skills.`
					}
				}

				const perm_error = await checkPermission(s, 'file', 'read', target.path)

				if (perm_error) {
					return { action: 'read', skill_name: input.skill_name, content: '', error: perm_error }
				}

				const content = await readFile(target.path, 'utf8')

				return {
					action: 'read',
					skill_name: input.skill_name,
					content,
					path: target.path
				}
			}

			if (input.action === 'build') {
				const skill_map = await rebuildSkillMap(s)

				return {
					action: 'build',
					count: skill_map.length,
					skills: skill_map.map(m => m.name)
				}
			}

			return { error: 'Unknown action' }
		}
	})
}
