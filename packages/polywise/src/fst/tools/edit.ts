import { basename, dirname, extname } from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
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
	edits: Array<{
		file_path: string
		file_name: string
		lang: string
		old_string: string
		new_string: string
		old_content: string
		new_content: string
	}>
}

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
			const result: EditResult = {
				status: 'success',
				edits: []
			}

			for (const edit of input.edits) {
				const real_path = getRealPath(s.cwd, edit.file_path)

				if (detectShellInjectionRisk(edit.file_path)) {
					const approved = await approve(
						s,
						'bash',
						'execute',
						`edit_file (RISKY!): ${edit.file_path}`
					)

					if (!approved) {
						result.status = 'error'
						result.message = 'Shell injection risk detected in path'
						return result
					}
				}

				const read_result = check(s, 'edit', 'read', real_path)

				if (read_result === 'needs_approval') {
					const approved = await approve(s, 'edit', 'read', real_path)

					if (!approved) {
						result.status = 'error'
						result.message = 'Permission denied for reading file'
						return result
					}
				}

				const write_result = check(s, 'edit', 'write', real_path)

				if (write_result === 'needs_approval') {
					const approved = await approve(s, 'edit', 'write', real_path)

					if (!approved) {
						result.status = 'error'
						result.message = 'Permission denied for writing file'
						return result
					}
				}

				try {
					await ensureDir(dirname(real_path))

					let content: string

					try {
						content = await readFile(real_path, 'utf8')
					} catch (error: any) {
						if (error.code === 'ENOENT') {
							content = ''
						} else {
							throw error
						}
					}

					if (edit.old_string && !content.includes(edit.old_string)) {
						result.status = 'error'
						result.message =
							'old_string not found in file. Ensure exact match including whitespace and newlines'
						return result
					}

					const new_content = edit.old_string
						? content.replace(edit.old_string, edit.new_string)
						: edit.new_string

					await writeFile(real_path, new_content, 'utf8')

					result.edits.push({
						file_path: edit.file_path,
						file_name: basename(edit.file_path),
						lang: getLangFromExt(edit.file_path),
						old_string: edit.old_string,
						new_string: edit.new_string,
						old_content: content,
						new_content
					})
				} catch (error) {
					result.status = 'error'
					result.message = (error as Error).message
					return result
				}
			}

			return result
		}
	})
}
