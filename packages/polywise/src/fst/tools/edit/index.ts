import { basename, dirname } from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import { createTwoFilesPatch } from 'diff'
import { ensureDir } from 'fs-extra'
import { array, object, string } from 'zod'

import { checkPermissions, getRealPath } from '../../utils'
import apply from './apply'
import count from './count'
import error from './error'
import getLang from './getLang'

import type Session from '../../session'

const CONTEXT_LINES = 4
const NEW_FILE_MAX_LINES = 10

const inputSchema = object({
	edits: array(
		object({
			file_path: string().describe('Absolute or relative path to the file to edit'),
			old_string: string().describe(
				'The exact string to find and replace. Must match the file content exactly including whitespace and newlines'
			),
			new_string: string().describe('The replacement string to write in place of old_string')
		})
	).describe('Array of edit operations to perform')
})

export const createEditFileTool = (s: Session) => {
	return tool({
		description:
			'Edit files by replacing old_string with new_string. Supports multiple edits in one call. Creates files if they do not exist.',
		inputSchema,
		execute: async input => {
			if (input.edits.length === 0) {
				return error('', 0, 'No edits provided')
			}

			const edits = input.edits
			const file_path = edits[0].file_path
			const real_path = getRealPath(s.cwd, file_path)
			const file_name = basename(file_path)
			const edit_count = edits.length

			const perm_error = await checkPermissions(s, file_path, real_path)

			if (perm_error) {
				return error(file_path, edit_count, perm_error)
			}

			try {
				await ensureDir(dirname(real_path))

				const original_content = await readFile(real_path, 'utf8')

				const is_new_file = original_content === ''
				const final_content = apply(original_content, edits)

				await writeFile(real_path, final_content, 'utf8')

				const patch_content = is_new_file
					? final_content.split('\n').slice(0, NEW_FILE_MAX_LINES).join('\n')
					: final_content

				const patch = createTwoFilesPatch(
					file_name,
					file_name,
					original_content,
					patch_content,
					undefined,
					undefined,
					{ context: CONTEXT_LINES }
				)

				const { add_lines, remove_lines } = count(patch)

				return {
					status: 'success' as const,
					file_path,
					file_name,
					lang: getLang(file_path),
					patch,
					edit_count,
					add_lines,
					remove_lines
				}
			} catch (err) {
				return error(file_path, edit_count, (err as Error).message)
			}
		}
	})
}

export * from './types'
