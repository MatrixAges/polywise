import { existsSync } from 'fs'
import { tool } from 'ai'
import { discriminatedUnion, literal, object, string } from 'zod'

import type Index from '../session'

const inputSchema = discriminatedUnion('action', [
	object({
		action: literal('getCwd').describe('Get current working directory info')
	}),
	object({
		action: literal('setCwd').describe(
			'Set cwd, can be set to files_dir or project_dir as the working directory'
		),
		path: string().describe('New working directory path')
	})
])

export const createCwdTool = (s: Index) => {
	return tool({
		description: 'Get or set current working directory for bash_tool and glob_tool.',
		inputSchema,
		execute: async input => {
			if (input.action === 'getCwd') {
				return {
					cwd: {
						desc: 'Current working directory for bash_tool and glob_tool',
						data: s.cwd
					},
					files_dir: {
						desc: 'Session files directory, auto-allowed for writes',
						data: s.files_dir
					},
					project_dir: {
						desc: 'Project root directory, auto-allowed for operations',
						data: s.project?.dir ?? null
					}
				}
			}

			if (input.action === 'setCwd') {
				if (!existsSync(input.path)) {
					throw new Error(`Path does not exist: ${input.path}`)
				}

				s.cwd = input.path

				return {
					cwd: {
						desc: 'Current working directory for bash_tool and glob_tool',
						data: s.cwd
					},
					files_dir: {
						desc: 'Session files directory, auto-allowed for writes',
						data: s.files_dir
					},
					project_dir: {
						desc: 'Project root directory, auto-allowed for operations',
						data: s.project?.dir ?? null
					}
				}
			}
		}
	})
}
