import { spawn } from 'child_process'

export const isToolInstalled = async (tool_name: string) => {
	const shell = process.env.SHELL ?? '/bin/sh'

	return await new Promise<boolean>(resolve => {
		const child =
			process.platform === 'win32'
				? spawn('where', [tool_name], {
						shell: false,
						stdio: 'ignore'
					})
				: spawn(shell, ['-lc', `command -v ${tool_name}`], {
						shell: false,
						env: process.env,
						stdio: 'ignore'
					})

		child.on('error', () => resolve(false))
		child.on('close', code => resolve(code === 0))
	})
}

export const runShellCommand = async (command: string) => {
	const shell = process.env.SHELL ?? '/bin/sh'

	return await new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const stdout_chunks: Array<string> = []
		const stderr_chunks: Array<string> = []
		const use_windows_shell = process.platform === 'win32'

		const child = use_windows_shell
			? spawn('cmd', ['/d', '/s', '/c', command], {
					shell: false,
					env: process.env
				})
			: spawn(shell, ['-lc', command], {
					shell: false,
					env: process.env
				})

		child.stdout?.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr?.on('data', chunk => {
			stderr_chunks.push(String(chunk))
		})

		child.on('error', error => {
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: error.message || stderr_chunks.join(''),
				exitCode: 1
			})
		})

		child.on('close', code => {
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join(''),
				exitCode: code ?? 1
			})
		})
	})
}
