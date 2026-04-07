import { readFile, writeFile } from 'atomically'
import { createBashTool } from 'bash-tool'

import checkPermission from './checkPermission'
import getBashResponse from './getBashResponse'
import getRealPath from './getRealPath'

import type { Sandbox } from 'bash-tool'
import type { Bash } from 'just-bash'
import type Index from '../session'

export default async (s: Index, bash: Bash, system?: boolean) => {
	const path_mappings: Record<string, string> = {
		'/skills': s.skills_dir
	}

	const { tools } = await createBashTool({
		destination: '/',
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
				if (command === 'ls /usr/bin /usr/local/bin /bin /sbin /usr/sbin 2>/dev/null') {
					const res = await bash.exec(command, { cwd: '/' })

					return getBashResponse(res)
				}

				const cleanCommand = command.replace(/^cd\s+"[^"]+"\s+&&\s+/, '')

				const perm_error = await checkPermission(
					s,
					'bash',
					'execute',
					cleanCommand,
					cleanCommand,
					system
				)

				if (perm_error) {
					return { stdout: '', stderr: perm_error, exitCode: 1 }
				}

				const res = await bash.exec(command, { cwd: '/' })

				return getBashResponse(res)
			}
		} as Sandbox
	})

	return tools
}
