import path from 'path'
import { app } from '@core/consts'
import { skill } from '@core/db/schema'
import {
	addSkill,
	getSkill,
	getSkillOrderMax,
	removeAgentSkillsBySkillIds,
	removeSkill,
	setSkill
} from '@core/db/services'
import parseFrontmatter from '@core/fst/tools/skill/meta'
import rebuildSkillMap from '@core/fst/tools/skill/rebuild'
import { writeFile } from 'atomically'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

type WriteSkillMode = 'create' | 'ensure' | 'update'

interface WriteSkillArgs {
	id?: string
	name: string
	desc: string
	content: string
	type?: string
	mode: WriteSkillMode
}

const getSkillDirName = (name: string) => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export const getSkillDirPath = (name: string) => path.resolve(app.app_path, 'skills', getSkillDirName(name))

export const getSkillFilePath = (name: string) => path.resolve(getSkillDirPath(name), 'SKILL.md')

export const getSkillItemDirPath = (skill_item: { path: string }) => {
	return skill_item.path.endsWith('SKILL.md') ? path.dirname(skill_item.path) : skill_item.path
}

const ensureSkillDirName = (name: string) => {
	const skill_dir_name = getSkillDirName(name)

	if (!skill_dir_name) {
		throw new Error('Invalid skill name')
	}

	return skill_dir_name
}

const getCurrentSkill = async (args: { id?: string; name: string }) => {
	if (args.id) {
		return getSkill(eq(skill.id, args.id))
	}

	return getSkill(eq(skill.name, args.name))
}

export const getSkillEntryPaths = (args: { skill_dir: string; target_path: string }) => {
	const { skill_dir, target_path } = args
	const entry_path = path.resolve(target_path)
	const relative_path = path.relative(skill_dir, entry_path)

	return {
		entry_path,
		relative_path,
		is_root: relative_path === ''
	}
}

export const assertSkillEntryPath = (args: {
	skill_dir: string
	target_path: string
	error_message: string
	allow_root?: boolean
}) => {
	const { skill_dir, target_path, error_message, allow_root = false } = args
	const { entry_path, relative_path, is_root } = getSkillEntryPaths({ skill_dir, target_path })

	if (relative_path.startsWith('..') || path.isAbsolute(relative_path) || relative_path.includes(`..${path.sep}`)) {
		throw new Error(error_message)
	}

	if (!allow_root && is_root) {
		throw new Error(error_message)
	}

	return {
		entry_path,
		relative_path,
		is_root
	}
}

export const writeSkill = async (args: WriteSkillArgs) => {
	ensureSkillDirName(args.name)

	const current_skill = await getCurrentSkill({ id: args.id, name: args.name })

	if (current_skill) {
		if (args.mode === 'create') {
			throw new Error(`Skill already exists: ${args.name}`)
		}
	} else if (args.mode === 'update') {
		throw new Error(`Skill not found: ${args.id ?? args.name}`)
	}

	const next_dir_path = getSkillDirPath(args.name)
	const next_file_path = getSkillFilePath(args.name)
	const prev_dir_path = current_skill ? getSkillItemDirPath(current_skill) : ''
	const same_dir = current_skill ? prev_dir_path === next_dir_path : false
	const next_file_exists = await fs.pathExists(next_file_path)

	if (current_skill) {
		const same_name = current_skill.name === args.name

		if (!same_name) {
			const duplicate_skill = await getSkill(eq(skill.name, args.name))

			if (duplicate_skill && duplicate_skill.id !== current_skill.id) {
				throw new Error(`Skill already exists: ${args.name}`)
			}
		}

		if (!same_dir && (await fs.pathExists(next_dir_path))) {
			throw new Error(`Skill already exists: ${args.name}`)
		}

		if (!same_dir && (await fs.pathExists(prev_dir_path))) {
			await fs.move(prev_dir_path, next_dir_path)
		}
	} else if (next_file_exists && args.mode !== 'ensure') {
		throw new Error(`Skill already exists: ${args.name}`)
	}

	const should_write_file = !!current_skill || !next_file_exists

	if (should_write_file) {
		await fs.ensureDir(path.dirname(next_file_path))
		await writeFile(next_file_path, args.content, 'utf8')
	}

	const persisted_content = should_write_file ? args.content : await fs.readFile(next_file_path, 'utf8')
	const persisted_meta = parseFrontmatter(persisted_content)

	const next_skill = current_skill
		? await setSkill(eq(skill.id, current_skill.id), {
				name: args.name,
				desc: args.desc,
				path: next_dir_path,
				type: args.type,
				updated_at: new Date()
			})
		: await addSkill({
				name: args.name,
				desc: persisted_meta?.description || args.desc,
				path: next_dir_path,
				order: (await getSkillOrderMax()) + 1,
				type: args.type
			})

	await rebuildGlobalSkillMap()

	return next_skill
}

export const createSkill = async (args: Omit<WriteSkillArgs, 'mode' | 'id'>) => {
	return writeSkill({ ...args, mode: 'create', id: undefined })
}

export const updateSkill = async (args: Omit<WriteSkillArgs, 'mode'>) => {
	return writeSkill({ ...args, mode: 'update' })
}

export const ensureSkillDefaults = async (args: Omit<WriteSkillArgs, 'mode' | 'id'>) => {
	const current_skill = await getCurrentSkill({ name: args.name })

	if (current_skill) {
		return current_skill
	}

	return writeSkill({ ...args, mode: 'ensure', id: undefined })
}

export const removeSkillItem = async (id: string) => {
	const current_skill = await getSkill(eq(skill.id, id))

	if (!current_skill) {
		return null
	}

	await removeAgentSkillsBySkillIds([id])

	const skill_dir = getSkillItemDirPath(current_skill)

	if (skill_dir) {
		await fs.remove(skill_dir)
	}

	const removed_skill = await removeSkill(eq(skill.id, id))

	await rebuildGlobalSkillMap()

	return removed_skill
}

export const rebuildGlobalSkillMap = async () => {
	return rebuildSkillMap({ skills_dir: path.resolve(app.app_path, 'skills'), skill_map: [] } as never)
}
