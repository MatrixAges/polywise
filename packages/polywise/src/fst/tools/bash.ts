import { readFile, writeFile } from 'atomically'
import { createBashTool as BashTool } from 'bash-tool'
import { Bash } from 'just-bash'

import { checkPermission, requestApproval } from '../session/permission'

import type { Sandbox } from 'bash-tool'
import type Index from '../session'

export const createBashTool = async (s: Index) => {
	const bash = new Bash({ cwd: s.cwd })

	const { tools } = await BashTool({
		destination: s.cwd,
		sandbox: {
			async readFile(path) {
				const result = checkPermission(s, 'file', 'read', path)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'file', 'read', path)

					if (!approved) {
						throw new Error(`Permission denied: file read ${path}`)
					}
				}

				return readFile(path, 'utf8')
			},
			async writeFiles(files) {
				for (const file of files) {
					const result = checkPermission(s, 'file', 'write', file.path)

					if (result === 'needs_approval') {
						const approved = await requestApproval(s, 'file', 'write', file.path)

						if (!approved) {
							throw new Error(`Permission denied: file write ${file.path}`)
						}
					}
				}

				for (const file of files) {
					await writeFile(file.path, file.content)
				}
			},
			async executeCommand(command) {
				if (command === 'ls /usr/bin /usr/local/bin /bin /sbin /usr/sbin 2>/dev/null') {
					return bash.exec(command, { cwd: s.cwd })
				}

				const result = checkPermission(s, 'bash', 'execute', command)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'bash', 'execute', command)

					if (!approved) {
						return { stdout: '', stderr: 'Permission denied', exitCode: 1 }
					}
				}

				return bash.exec(command, { cwd: s.cwd })
			}
		} as Sandbox
	})

	return tools
}
