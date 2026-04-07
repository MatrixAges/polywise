import { dirname } from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import { ensureDir } from 'fs-extra'
import { object, string } from 'zod'

import { approve, check } from '../agents'
import getRealPath from '../utils/getRealPath'
import { detectShellInjectionRisk } from '../utils/safeshell'

import type Session from '../session'

const inputSchema = object({
	file_path: string().describe('Absolute or relative path to the file to edit'),
	old_string: string().describe(
		'The exact string to find and replace. Must match the file content exactly including whitespace and newlines'
	),
	new_string: string().describe('The replacement string to write in place of old_string')
})

export const createEditFileTool = (s: Session) => {
	return tool({
		description:
			'Edit a file by replacing the first occurrence of old_string with new_string. Creates the file if it does not exist.',
		inputSchema,
		execute: async input => {
			const real_path = getRealPath(s.cwd, input.file_path)

			if (detectShellInjectionRisk(input.file_path)) {
				const approved = await approve(s, 'bash', 'execute', `edit_file (RISKY!): ${input.file_path}`)

				if (!approved) {
					return 'error: Shell injection risk detected in path'
				}
			}

			const read_result = check(s, 'edit', 'read', real_path)

			if (read_result === 'needs_approval') {
				const approved = await approve(s, 'edit', 'read', real_path)

				if (!approved) {
					return 'error: Permission denied for reading file'
				}
			}

			const write_result = check(s, 'edit', 'write', real_path)

			if (write_result === 'needs_approval') {
				const approved = await approve(s, 'edit', 'write', real_path)

				if (!approved) {
					return 'error: Permission denied for writing file'
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

				if (input.old_string && !content.includes(input.old_string)) {
					return 'error: old_string not found in file. Ensure exact match including whitespace and newlines'
				}

				const new_content = input.old_string
					? content.replace(input.old_string, input.new_string)
					: input.new_string

				await writeFile(real_path, new_content, 'utf8')

				return 'success'
			} catch (error) {
				return `error: ${(error as Error).message}`
			}
		}
	})
}
