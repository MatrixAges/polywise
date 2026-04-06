import path from 'path'
import { readFile, writeFile } from 'atomically'
import { createBashTool as BashTool } from 'bash-tool'
import { Bash, ReadWriteFs } from 'just-bash'

import { checkPermission, requestApproval } from '../session/permission'
import getBashResponse from '../utils/getBashResponse'
import { detectShellInjectionRisk } from '../utils/safeshell'

import type { Sandbox } from 'bash-tool'
import type Index from '../session'

const getRealPath = (cwd: string, virtual_path: string): string => {
	if (path.posix.isAbsolute(virtual_path)) return path.join(cwd, virtual_path)

	return path.join(cwd, virtual_path)
}

export const createBashTool = async (s: Index) => {
	const bash = new Bash({ cwd: '/', fs: new ReadWriteFs({ root: s.cwd }) })

	const { tools } = await BashTool({
		destination: '/',
		sandbox: {
			async readFile(virtual_path) {
				const real_path = getRealPath(s.cwd, virtual_path)
				const result = checkPermission(s, 'file', 'read', real_path)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'file', 'read', real_path)

					if (!approved) {
						throw new Error(`Permission denied: file read ${real_path}`)
					}
				}

				if (detectShellInjectionRisk(virtual_path)) {
					const approved = await requestApproval(
						s,
						'bash',
						'execute',
						`readFile (risky path): ${virtual_path}`
					)

					if (!approved) {
						throw new Error(`Shell injection risk detected in path: ${virtual_path}`)
					}
				}

				return readFile(real_path, 'utf8')
			},
			async writeFiles(files) {
				for (const file of files) {
					const real_path = getRealPath(s.cwd, file.path)
					const result = checkPermission(s, 'file', 'write', real_path)

					if (result === 'needs_approval') {
						const approved = await requestApproval(s, 'file', 'write', real_path)

						if (!approved) {
							throw new Error(`Permission denied: file write ${real_path}`)
						}
					}
				}

				for (const file of files) {
					if (detectShellInjectionRisk(file.path)) {
						const approved = await requestApproval(
							s,
							'bash',
							'execute',
							`writeFile (risky path): ${file.path}`
						)

						if (!approved) {
							throw new Error(`Shell injection risk detected in path: ${file.path}`)
						}
					}
				}

				for (const file of files) {
					await writeFile(getRealPath(s.cwd, file.path), file.content)
				}
			},
			async executeCommand(command) {
				if (command === 'ls /usr/bin /usr/local/bin /bin /sbin /usr/sbin 2>/dev/null') {
					const res = await bash.exec(command, { cwd: '/' })

					return getBashResponse(res)
				}

				const cleanCommand = command.replace(/^cd\s+"[^"]+"\s+&&\s+/, '')

				const result = checkPermission(s, 'bash', 'execute', cleanCommand)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, 'bash', 'execute', cleanCommand)

					if (!approved) {
						return { stdout: '', stderr: 'Permission denied', exitCode: 1 }
					}
				}

				if (detectShellInjectionRisk(cleanCommand)) {
					const approved = await requestApproval(
						s,
						'bash',
						'execute',
						`command (risky): ${cleanCommand}`
					)

					if (!approved) {
						return { stdout: '', stderr: 'Shell injection risk detected', exitCode: 1 }
					}
				}

				const res = await bash.exec(command, { cwd: '/' })

				return getBashResponse(res)
			}
		} as Sandbox
	})

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}
