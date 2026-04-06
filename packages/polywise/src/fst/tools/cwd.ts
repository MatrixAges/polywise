import { existsSync } from 'fs'
import { tool } from 'ai'
import { discriminatedUnion, literal, object, string } from 'zod'

import type Index from '../session'

const inputSchema = discriminatedUnion('action', [
	object({
		action: literal('get_working_dir').describe('Get current working directory info')
	}),
	object({
		action: literal('set_working_dir').describe(
			'Set cwd, can be set to files_dir or project_dir as the working directory'
		),
		path: string().describe('New working directory path')
	})
]).describe('')

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

export const createWorkingDirTool = (s: Index) => {
	return tool({
		description: 'Get or set current working directory.',
		inputSchema,
		execute: async input => {
			if (input.action === 'set_working_dir') {
				if (!existsSync(input.path)) {
					throw new Error(`Path does not exist: ${input.path}`)
				}

				s.cwd = input.path
			}

			return getResult(s)
		}
	})
}
