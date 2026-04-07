import { readFile, writeFile } from 'atomically'
import { createBashTool } from 'bash-tool'

import { checkPermission, requestApproval } from '../session/permission'
import getBashResponse from './getBashResponse'
import getRealPath from './getRealPath'
import { detectShellInjectionRisk } from './safeshell'

import type { Sandbox } from 'bash-tool'
import type { Bash } from 'just-bash'
import type Index from '../session'

export default async (s: Index, bash: Bash, system?: boolean) => {
	const { tools } = await createBashTool({
		destination: '/',
		sandbox: {
			async readFile(virtual_path) {
				const real_path = getRealPath(s.cwd, virtual_path)

				if (!system) {
					const result = checkPermission(s, 'file', 'read', real_path)

					if (result === 'needs_approval') {
						const approved = await requestApproval(s, 'file', 'read', real_path)

						if (!approved) {
							throw new Error(`Permission denied: file read ${real_path}`)
						}
					}
				} else {
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
						`readFile (RISKY!): ${virtual_path}`
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

					if (!system) {
						const result = checkPermission(s, 'file', 'write', real_path)

						if (result === 'needs_approval') {
							const approved = await requestApproval(s, 'file', 'write', real_path)

							if (!approved) {
								throw new Error(`Permission denied: file write ${real_path}`)
							}
						}
					} else {
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
							`writeFile (RISKY!): ${file.path}`
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

				if (!system) {
					const result = checkPermission(s, 'bash', 'execute', cleanCommand)

					if (result === 'needs_approval') {
						const approved = await requestApproval(s, 'bash', 'execute', cleanCommand)

						if (!approved) {
							return { stdout: '', stderr: 'Permission denied', exitCode: 1 }
						}
					}
				} else {
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
						`command (RISKY!): ${cleanCommand}`
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

	return tools
}
