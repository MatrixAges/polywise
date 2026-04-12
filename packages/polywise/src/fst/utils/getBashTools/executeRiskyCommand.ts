import { spawn } from 'child_process'

export default async (command: string, cwd: string) => {
	const shell_path = process.env.SHELL ?? '/bin/sh'

	return new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const stdout_chunks = [] as Array<string>
		const stderr_chunks = [] as Array<string>

		const child = spawn(shell_path, ['-lc', command], {
			cwd,
			env: process.env,
			shell: false
		})

		child.stdout.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr.on('data', chunk => {
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
