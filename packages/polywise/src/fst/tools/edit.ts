import { basename, dirname, extname } from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import { createTwoFilesPatch } from 'diff'
import { ensureDir } from 'fs-extra'
import { array, object, string } from 'zod'

import { approve, check } from '../agents'
import getRealPath from '../utils/getRealPath'
import { detectShellInjectionRisk } from '../utils/safeshell'

import type Session from '../session'

const editSchema = object({
	file_path: string().describe('Absolute or relative path to the file to edit'),
	old_string: string().describe(
		'The exact string to find and replace. Must match the file content exactly including whitespace and newlines'
	),
	new_string: string().describe('The replacement string to write in place of old_string')
})

const inputSchema = object({
	edits: array(editSchema).describe('Array of edit operations to perform')
})

export interface EditResult {
	status: 'success' | 'error'
	message?: string
	file_path: string
	file_name: string
	lang: string
	patch: string
	edit_count: number
}

const CONTEXT_LINES = 4
const NEW_FILE_MAX_LINES = 10

const getLangFromExt = (file_path: string): string => {
	const ext = extname(file_path).toLowerCase()
	const map: Record<string, string> = {
		'.ts': 'typescript',
		'.tsx': 'tsx',
		'.js': 'javascript',
		'.jsx': 'jsx',
		'.json': 'json',
		'.md': 'markdown',
		'.css': 'css',
		'.scss': 'scss',
		'.html': 'html',
		'.xml': 'xml',
		'.py': 'python',
		'.rs': 'rust',
		'.go': 'go',
		'.java': 'java',
		'.c': 'c',
		'.cpp': 'cpp',
		'.h': 'c',
		'.hpp': 'cpp',
		'.sql': 'sql',
		'.sh': 'bash',
		'.yaml': 'yaml',
		'.yml': 'yaml',
		'.toml': 'toml',
		'.graphql': 'graphql',
		'.gql': 'graphql'
	}

	return map[ext] ?? 'text'
}

export const createEditFileTool = (s: Session) => {
	return tool({
		description:
			'Edit files by replacing old_string with new_string. Supports multiple edits in one call. Creates files if they do not exist.',
		inputSchema,
		execute: async input => {
			if (input.edits.length === 0) {
				return {
					status: 'error' as const,
					message: 'No edits provided',
					file_path: '',
					file_name: '',
					lang: 'text',
					patch: '',
					edit_count: 0
				}
			}

			const file_path = input.edits[0].file_path
			const real_path = getRealPath(s.cwd, file_path)

			if (detectShellInjectionRisk(file_path)) {
				const approved = await approve(s, 'bash', 'execute', `edit_file (RISKY!): ${file_path}`)

				if (!approved) {
					return {
						status: 'error' as const,
						message: 'Shell injection risk detected in path',
						file_path,
						file_name: basename(file_path),
						lang: getLangFromExt(file_path),
						patch: '',
						edit_count: input.edits.length
					}
				}
			}

			const read_result = check(s, 'edit', 'read', real_path)

			if (read_result === 'needs_approval') {
				const approved = await approve(s, 'edit', 'read', real_path)

				if (!approved) {
					return {
						status: 'error' as const,
						message: 'Permission denied for reading file',
						file_path,
						file_name: basename(file_path),
						lang: getLangFromExt(file_path),
						patch: '',
						edit_count: input.edits.length
					}
				}
			}

			const write_result = check(s, 'edit', 'write', real_path)

			if (write_result === 'needs_approval') {
				const approved = await approve(s, 'edit', 'write', real_path)

				if (!approved) {
					return {
						status: 'error' as const,
						message: 'Permission denied for writing file',
						file_path,
						file_name: basename(file_path),
						lang: getLangFromExt(file_path),
						patch: '',
						edit_count: input.edits.length
					}
				}
			}

			try {
				await ensureDir(dirname(real_path))

				let original_content: string

				try {
					original_content = await readFile(real_path, 'utf8')
				} catch (error: any) {
					if (error.code === 'ENOENT') {
						original_content = ''
					} else {
						throw error
					}
				}

				const is_new_file = original_content === ''
				let final_content = original_content

				for (const edit of input.edits) {
					if (edit.old_string && !final_content.includes(edit.old_string)) {
						return {
							status: 'error' as const,
							message: 'old_string not found in file. Ensure exact match including whitespace and newlines',
							file_path,
							file_name: basename(file_path),
							lang: getLangFromExt(file_path),
							patch: '',
							edit_count: input.edits.length
						}
					}

					final_content = edit.old_string
						? final_content.replace(edit.old_string, edit.new_string)
						: edit.new_string
				}

				await writeFile(real_path, final_content, 'utf8')

				const file_name = basename(file_path)
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

				return {
					status: 'success' as const,
					file_path,
					file_name,
					lang: getLangFromExt(file_path),
					patch,
					edit_count: input.edits.length
				}
			} catch (error) {
				return {
					status: 'error' as const,
					message: (error as Error).message,
					file_path,
					file_name: basename(file_path),
					lang: getLangFromExt(file_path),
					patch: '',
					edit_count: input.edits.length
				}
			}
		}
	})
}
