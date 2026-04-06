import { existsSync } from 'fs'
import { tool } from 'ai'
import { enum as Enum, object, string } from 'zod'

import type Index from '../session'

const inputSchema = object({
	action: Enum(['get_cwd', 'set_cwd']).describe(
		'Choose an action: get_cwd to view current dirs, set_cwd to change the working directory'
	),
	path: string().optional().describe('New working directory path, required if action is set_cwd')
})

const getResult = (s: Index) => ({
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
})

export const createCwdTool = (s: Index) => {
	return tool({
		description: 'Get or set current working directory.',
		inputSchema,
		execute: async input => {
			if (input.action === 'set_cwd') {
				if (!input.path || !existsSync(input.path)) {
					throw new Error(`Path does not exist: ${input.path}`)
				}

				s.cwd = input.path
			}

			return getResult(s)
		}
	})
}
