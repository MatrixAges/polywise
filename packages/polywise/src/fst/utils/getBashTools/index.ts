import { zodSchema } from '@ai-sdk/provider-utils'
import { readFile, writeFile } from 'atomically'
import { createBashTool } from 'bash-tool'

import checkPermission from '../checkPermission'
import getPathMappings from '../getPathMappings'
import getRealPath from '../getRealPath'
import executeCommand from './executeCommand'

import type { Sandbox } from 'bash-tool'
import type { Bash } from 'just-bash'
import type Index from '../../session'

const normalizeSchema = <T>(schema: T): T => {
	if (!schema || typeof schema !== 'object') return schema

	const target = schema as Record<string, unknown>
	const looks_like_legacy_zod =
		typeof target.parse === 'function' &&
		typeof target.safeParse === 'function' &&
		!('_zod' in target) &&
		!('~standard' in target)

	return (looks_like_legacy_zod ? zodSchema(schema as never) : schema) as T
}

export default async (s: Index, bash: Bash, system?: boolean) => {
	const is_plan_mode = s.mode === 'plan' || (s.mode === 'plan-exec' && s.plan_stage === 'plan')

	const path_mappings = getPathMappings(s)

	const { tools } = await createBashTool({
		destination: '/',
		extraInstructions: [
			'Prefer narrow, scoped commands over broad recursive scans.',
			'Do not scan from filesystem root such as `find /`, `grep -r /`, or similar whole-tree discovery commands unless the user explicitly requires it.',
			'Start from the current working directory or another precise known path, and limit the search scope as much as possible.',
			'For custom tools, use `meta_tool` instead of inspecting tool files with bash.'
		].join('\n'),
		sandbox: {
			async readFile(virtual_path) {
				const real_path = getRealPath(s.cwd, virtual_path, path_mappings)

				const perm_error = await checkPermission(s, 'file', 'read', real_path, virtual_path, system)

				if (perm_error) {
					throw new Error(perm_error)
				}

				return readFile(real_path, 'utf8')
			},
			async writeFiles(files) {
				if (is_plan_mode) {
					throw new Error('Current in plan mode, write operations are not allowed')
				}

				for (const file of files) {
					const real_path = getRealPath(s.cwd, file.path, path_mappings)

					const perm_error = await checkPermission(s, 'file', 'write', real_path, file.path, system)

					if (perm_error) {
						throw new Error(perm_error)
					}
				}

				for (const file of files) {
					await writeFile(getRealPath(s.cwd, file.path, path_mappings), file.content)
				}
			},
			async executeCommand(command) {
				if (is_plan_mode) {
					return {
						stdout: '',
						stderr: 'Current in plan mode, bash operations are not allowed, use other tools instead',
						exitCode: 1
					}
				}

				return executeCommand({ s, bash, command, system })
			}
		} as Sandbox
	})

	for (const tool of [tools.bash, tools.readFile, tools.writeFile]) {
		tool.inputSchema = normalizeSchema(tool.inputSchema)

		if ('outputSchema' in tool) {
			tool.outputSchema = normalizeSchema(tool.outputSchema)
		}
	}

	return tools
}
