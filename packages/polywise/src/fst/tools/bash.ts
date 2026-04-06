import path from 'path'
import { readFile, writeFile } from 'atomically'
import { createBashTool as BashTool } from 'bash-tool'
import { Bash, ReadWriteFs } from 'just-bash'

import { checkPermission, requestApproval } from '../session/permission'

import type { Sandbox } from 'bash-tool'
import type Index from '../session'

const toRealPath = (cwd: string, virtualPath: string): string => {
	if (path.posix.isAbsolute(virtualPath)) {
		return path.join(cwd, virtualPath)
	}

	return path.join(cwd, virtualPath)
}

export const createBashTool = async (s: Index) => {
	const bash = new Bash({ cwd: '/', fs: new ReadWriteFs({ root: s.cwd }) })

	const { tools } = await BashTool({
		destination: '/',
		sandbox: {
			async readFile(virtualPath) {
				const realPath = toRealPath(s.cwd, virtualPath)
				const result = checkPermission(s, 'file', 'read', realPath)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'file', 'read', realPath)

					if (!approved) {
						throw new Error(`Permission denied: file read ${realPath}`)
					}
				}

				return readFile(realPath, 'utf8')
			},
			async writeFiles(files) {
				for (const file of files) {
					const realPath = toRealPath(s.cwd, file.path)
					const result = checkPermission(s, 'file', 'write', realPath)

					if (result === 'needs_approval') {
						const approved = await requestApproval(s, 'file', 'write', realPath)

						if (!approved) {
							throw new Error(`Permission denied: file write ${realPath}`)
						}
					}
				}

				for (const file of files) {
					const realPath = toRealPath(s.cwd, file.path)
					await writeFile(realPath, file.content)
				}
			},
			async executeCommand(command) {
				if (command === 'ls /usr/bin /usr/local/bin /bin /sbin /usr/sbin 2>/dev/null') {
					return bash.exec(command, { cwd: '/' })
				}

				const cleanCommand = command.replace(/^cd\s+"[^"]+"\s+&&\s+/, '')

				const result = checkPermission(s, 'bash', 'execute', cleanCommand)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'bash', 'execute', cleanCommand)

					if (!approved) {
						return { stdout: '', stderr: 'Permission denied', exitCode: 1 }
					}
				}

				return bash.exec(command, { cwd: '/' })
			}
		} as Sandbox
	})

	return tools
}
