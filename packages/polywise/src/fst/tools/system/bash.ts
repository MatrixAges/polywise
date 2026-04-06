import { readFile } from 'atomically'
import { createBashTool as BashTool } from 'bash-tool'
import { Bash } from 'just-bash'

import { requestApproval } from '../../session/permission'
import getBashResponse from '../../utils/getBashResponse'
import { detectShellInjectionRisk } from '../../utils/safeshell'
import { bfs } from './mounts'
import { hasReadPermission } from './permissions'

import type { Sandbox } from 'bash-tool'
import type Index from '../../session'

export const createSystemBashTool = async (s: Index) => {
	const sandboxEnv = { ...process.env } as Record<string, string>

	sandboxEnv.PATH = `/bin:/usr/bin:${sandboxEnv.PATH || ''}`

	const bash = new Bash({
		cwd: '/',
		fs: bfs,
		env: sandboxEnv
	})

	const { tools } = await BashTool({
		destination: '/',
		sandbox: {
			async readFile(virtual_path) {
				const real_path = virtual_path

				if (!hasReadPermission(s, real_path)) {
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
					const approved = await requestApproval(s, 'file', 'write', file.path)

					if (!approved) {
						throw new Error(`Permission denied: file write ${file.path}`)
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
			},
			async executeCommand(command) {
				const is_risky = detectShellInjectionRisk(command)
				const approval_path = is_risky ? `command (risky): ${command}` : command
				const approved = await requestApproval(s, 'bash', 'execute', approval_path)

				if (!approved) {
					return { stdout: '', stderr: 'Permission denied', exitCode: 1 }
				}

				const res = await bash.exec(command, { cwd: '/' })

				return getBashResponse(res)
			}
		} as Sandbox
	})

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}
