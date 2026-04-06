import fs from 'fs'
import system_agent_prompt from '@core/consts/prompts/system_agent_prompt.md'
import { readUIMessageStream, stepCountIs, tool, ToolLoopAgent } from 'ai'
import { readFile } from 'atomically'
import { createBashTool as BashTool } from 'bash-tool'
import { Bash, InMemoryFs, MountableFs, ReadWriteFs } from 'just-bash'
import { minimatch } from 'minimatch'
import { object, string } from 'zod'

import { requestApproval } from '../session/permission'
import getBashResponse from '../utils/getBashResponse'
import { detectShellInjectionRisk } from '../utils/safeshell'

import type { Sandbox } from 'bash-tool'
import type Index from '../session'

const SYSTEM_MOUNT_PATHS: Record<string, string[]> = {
	darwin: ['/Users', '/Applications', '/Volumes', '/usr/local', '/opt', '/tmp'],
	linux: ['/home', '/var', '/opt', '/mnt', '/media', '/tmp'],
	win32: ['C:\\Users', 'C:\\ProgramData']
}

const getRootMounts = () => {
	const platform = process.platform
	const paths = SYSTEM_MOUNT_PATHS[platform] || SYSTEM_MOUNT_PATHS.linux
	const mounts: { mountPoint: string; filesystem: any }[] = []

	for (const path of paths) {
		try {
			const stat = fs.statSync(path)

			if (!stat.isDirectory()) continue

			mounts.push({
				mountPoint: path,
				filesystem: new ReadWriteFs({
					root: path,
					allowSymlinks: true
				})
			})
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Failed to mount ${path}:`, err)
			}
		}
	}

	return mounts
}

const bfs = new MountableFs({
	base: new InMemoryFs(),
	mounts: getRootMounts()
})

const isPathInDir = (target_path: string, dir: string): boolean => {
	const normalized_path = target_path.replace(/\\/g, '/')
	const normalized_dir = dir.replace(/\\/g, '/').replace(/\/$/, '')

	return normalized_path.startsWith(normalized_dir + '/') || normalized_path === normalized_dir
}

const hasReadPermission = (s: Index, path: string): boolean => {
	return s.permissions.some(p => {
		if (p.tool !== 'file' || p.action !== 'read') return false

		return minimatch(path, p.path) || isPathInDir(path, p.path)
	})
}

const createSystemBashTool = async (s: Index) => {
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

export const createSystemTool = (s: Index) => {
	return tool({
		description:
			'Access files and directories outside the project working directory, such as user home directory or system directories. For paths that bash_tool cannot reach, use this tool instead.',
		inputSchema: object({
			request: string().describe('Natural language request for file system operation')
		}),
		execute: async function* ({ request }, { abortSignal }) {
			const bash_tool = await createSystemBashTool(s)

			const agent = new ToolLoopAgent({
				model: s.model.model,
				instructions: system_agent_prompt,
				tools: {
					bash: bash_tool.bash,
					read_file: bash_tool.readFile,
					write_file: bash_tool.writeFile
				},
				stopWhen: stepCountIs(15)
			})

			const result = await agent.stream({
				prompt: request,
				abortSignal
			})

			for await (const message of readUIMessageStream({
				stream: result.toUIMessageStream()
			})) {
				yield message
			}
		}
	})
}
