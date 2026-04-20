import path from 'path'
import { tool } from 'ai'
import { readFile } from 'atomically'
import fs from 'fs-extra'
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
		execute: async input => {
			const getSkillDirName = (name: string) => {
				return name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-+|-+$/g, '')
			}

			const getSkillTarget = async (skill_name: string) => {
				const skill_map = await readSkillMap(s)
				const current = skill_map.find(item => item.name === skill_name)

				if (current) {
					return {
						skill_map,
						current,
						skill_file_path: current.path,
						skill_dir: current.dir
					}
				}

				const skill_dir_name = getSkillDirName(skill_name)

				return {
					skill_map,
					current: null,
					skill_file_path: path.resolve(s.skills_dir, skill_dir_name, 'SKILL.md'),
					skill_dir: path.resolve(s.skills_dir, skill_dir_name)
				}
			}

			const writeSkillFile = async (args: {
				skill_name: string
				content: string
				require_existing: boolean
			}) => {
				const { skill_name, content, require_existing } = args
				const target = await getSkillTarget(skill_name)
				const skill_dir_name = getSkillDirName(skill_name)
				const skill_dir = target.skill_dir
				const skill_file_path = target.skill_file_path

				if (!skill_dir_name) {
					return { error: 'skill_name is invalid' }
				}

				const perm_error = await checkPermission(s, 'file', 'write', skill_file_path)

				if (perm_error) {
					return { error: perm_error }
				}

				if (require_existing) {
					if (!target.current) {
						return { error: `Skill "${skill_name}" does not exist. Use action "create" first.` }
					}
				} else if (target.current) {
					return { error: `Skill "${skill_name}" already exists. Use action "update" instead.` }
				}

				await fs.ensureDir(skill_dir)
				await fs.writeFile(skill_file_path, content, 'utf8')

				const skill_map = await rebuildSkillMap(s)
				const current = skill_map.find(
					item => item.path === skill_file_path || item.name === skill_name
				)

				return {
					path: skill_file_path,
					skill: current ?? null,
					count: skill_map.length
				}
			}

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

			if (input.action === 'create') {
				if (!input.build_name) {
					return { action: 'create', error: 'build_name is required for create action' }
				}

				if (!input.build_description) {
					return { action: 'create', error: 'build_description is required for create action' }
				}

				if (!input.build_content) {
					return { action: 'create', error: 'build_content is required for create action' }
				}

				const result = await writeSkillFile({
					skill_name: input.build_name,
					content: input.build_content,
					require_existing: false
				})

				if ('error' in result) {
					return { action: 'create', skill_name: input.build_name, error: result.error }
				}

				return {
					action: 'create',
					skill_name: input.build_name,
					description: input.build_description,
					path: result.path,
					skill: result.skill,
					count: result.count
				}
			}

			if (input.action === 'update') {
				if (!input.skill_name) {
					return { action: 'update', error: 'skill_name is required for update action' }
				}

				if (!input.build_description) {
					return { action: 'update', error: 'build_description is required for update action' }
				}

				if (!input.build_content) {
					return { action: 'update', error: 'build_content is required for update action' }
				}

				const result = await writeSkillFile({
					skill_name: input.skill_name,
					content: input.build_content,
					require_existing: true
				})

				if ('error' in result) {
					return { action: 'update', skill_name: input.skill_name, error: result.error }
				}

				return {
					action: 'update',
					skill_name: input.skill_name,
					description: input.build_description,
					path: result.path,
					skill: result.skill,
					count: result.count
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
