import path from 'path'
import { readFile } from 'atomically'
import fs from 'fs-extra'

import { checkPermission } from '../../utils'
import readSkillMap from './read'
import rebuildSkillMap from './rebuild'
import search from './search'

import type Session from '../../session'

export type SkillToolInput = {
	action: 'search' | 'read' | 'create' | 'update' | 'build'
	keyword?: string
	skill_name?: string
	max_results?: number
	build_name?: string
	build_description?: string
	build_content?: string
}

const getSkillDirName = (name: string) => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

const getSkillDir = (s: Session, skill_name: string) => {
	return path.resolve(s.skills_dir, getSkillDirName(skill_name))
}

const getSkillFilePath = (s: Session, skill_name: string) => {
	return path.resolve(getSkillDir(s, skill_name), 'SKILL.md')
}

const getSkillTarget = async (s: Session, skill_name: string) => {
	const skill_map = await readSkillMap(s)
	const current = skill_map.find(item => item.name === skill_name)

	if (current) {
		return {
			skill_map,
			current,
			skill_file_path: getSkillFilePath(s, current.name),
			skill_dir: getSkillDir(s, current.name)
		}
	}

	return {
		skill_map,
		current: null,
		skill_file_path: getSkillFilePath(s, skill_name),
		skill_dir: getSkillDir(s, skill_name)
	}
}

const writeSkillFile = async (args: {
	session: Session
	skill_name: string
	content: string
	require_existing: boolean
}) => {
	const { session, skill_name, content, require_existing } = args
	const target = await getSkillTarget(session, skill_name)
	const skill_dir_name = getSkillDirName(skill_name)
	const skill_dir = target.skill_dir
	const skill_file_path = target.skill_file_path

	if (!skill_dir_name) {
		return { error: 'skill_name is invalid' }
	}

	const perm_error = await checkPermission(session, 'file', 'write', skill_file_path)

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

	const skill_map = await rebuildSkillMap(session)
	const current = skill_map.find(item => item.name === skill_name)

	return {
		skill: current ?? null,
		count: skill_map.length
	}
}

export default async (s: Session, input: SkillToolInput) => {
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
		const target = skill_map.find(item => item.name === input.skill_name)

		if (!target) {
			return {
				action: 'read',
				skill_name: input.skill_name,
				content: '',
				error: `Skill "${input.skill_name}" not found in skill_map. Use action "search" to find available skills.`
			}
		}

		const skill_file_path = getSkillFilePath(s, target.name)

		const perm_error = await checkPermission(s, 'file', 'read', skill_file_path)

		if (perm_error) {
			return { action: 'read', skill_name: input.skill_name, content: '', error: perm_error }
		}

		const content = await readFile(skill_file_path, 'utf8')

		return {
			action: 'read',
			skill_name: input.skill_name,
			content,
			skill: target
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
			session: s,
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
			session: s,
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
			skill: result.skill,
			count: result.count
		}
	}

	if (input.action === 'build') {
		const skill_map = await rebuildSkillMap(s)

		return {
			action: 'build',
			count: skill_map.length,
			skills: skill_map.map(item => item.name)
		}
	}

	return { error: 'Unknown action' }
}
