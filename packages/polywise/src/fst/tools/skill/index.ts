import { tool } from 'ai'
import { readFile } from 'atomically'
import { literal, number, object, string, union } from 'zod'

import { checkPermission } from '../../utils'
import buildSkillMap from './build'
import search from './search'

import type Session from '../../session'

export { default as buildSkillMap } from './build'

export const search_schema = object({
	action: literal('search').describe('Action: search to find skills by keyword'),
	keyword: string().describe('Keywords to search for in skill names and descriptions'),
	max_results: number().optional().describe('Maximum results to return (default 5)')
})

export const read_schema = object({
	action: literal('read').describe('Action: read to get full skill content'),
	skill_name: string().describe('The exact skill name to read')
})

export const build_schema = object({
	action: literal('build').describe('Action: rebuild the skill_map index')
})

export const inputSchema = union([search_schema, read_schema, build_schema])

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

			if (input.action === 'build') {
				s.skill_map = await buildSkillMap(s.skills_dir)

				return {
					action: 'build',
					count: s.skill_map.length,
					skills: s.skill_map.map(m => m.name)
				}
			}

			return { error: 'Unknown action' }
		}
	})
}
