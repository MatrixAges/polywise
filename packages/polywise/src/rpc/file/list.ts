import path from 'path'
import fs from 'fs-extra'
import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'

import type { Dirent } from 'fs-extra'

export interface IFileListItem {
	id: string
	name: string
	dir: string
	file_type: 'directory' | 'file'
	has_children: boolean
}

const input_type = object({
	path: string(),
	show_hidden: boolean().optional(),
	dir_only: boolean().optional()
})

const toListItem = (args: { base_path: string; entry: Dirent }) => {
	const { base_path, entry } = args
	const next_path = path.resolve(base_path, entry.name)
	const next_dir_path = entry.isDirectory() ? `${next_path}/` : next_path

	return {
		id: next_dir_path,
		name: entry.name,
		dir: next_dir_path,
		file_type: entry.isDirectory() ? 'directory' : 'file',
		has_children: entry.isDirectory()
	} satisfies IFileListItem
}

export default p.input(input_type).query(async ({ input }) => {
	const target_path = path.resolve(input.path)
	const show_hidden = input.show_hidden ?? false
	const dir_only = input.dir_only ?? false

	if (!(await fs.pathExists(target_path))) {
		return [] as Array<IFileListItem>
	}

	try {
		const target_stat = await fs.stat(target_path)

		if (!target_stat.isDirectory()) {
			return [] as Array<IFileListItem>
		}
	} catch {
		return [] as Array<IFileListItem>
	}

	let entries = [] as Array<Dirent>

	try {
		entries = await fs.readdir(target_path, { withFileTypes: true })
	} catch {
		return [] as Array<IFileListItem>
	}

	return entries
		.filter(entry => show_hidden || !entry.name.startsWith('.'))
		.filter(entry => !dir_only || entry.isDirectory())
		.map(entry => toListItem({ base_path: target_path, entry }))
})
