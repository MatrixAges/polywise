import { tool } from 'ai'
import { readFile } from 'atomically'

import { checkPermission } from '../../utils'
import search from './search'
import { inputSchema } from './types'

import type Session from '../../session'

export { default as buildSkillMap } from './build'

export const createSkillTool = (s: Session) => {
	return tool({
		description: [
			'Search and read local skills from the skills/ directory.',
			'Use action "search" with keywords to find relevant skills by name and description.',
			'Use action "read" with an exact skill_name to get the full SKILL.md content.',
			'',
			'To discover, install, or update skills from the community, use web_fetch_tool',
			'with https://skills.sh/ to browse the skill directory, or use bash_tool to',
			'clone/install skill packages into the skills/ directory.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const { skill_map } = s

			if (input.action === 'search') {
				const max_results = input.max_results ?? 5
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

			return { error: 'Unknown action' }
		}
	})
}
