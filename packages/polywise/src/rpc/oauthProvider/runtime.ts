import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import { getRuntimeCommandEnv, resolveCommand } from '../../utils/resolveCommand'

import type { Model, ProviderConfig } from '@core/types'

export const isToolInstalled = async (tool_name: string) => {
	return Boolean(await resolveCommand(tool_name))
}

const stripAnsi = (value: string) => value.replace(/\u001B\[[0-9;]*m/g, '')

const quotePosix = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`

const buildInteractiveShellCommand = (args: { label: string; command: string }) => {
	const { label, command } = args
	const shell_path = process.env.SHELL?.trim() || '/bin/sh'
	const command_path = process.cwd()

	return [
		`cd ${quotePosix(command_path)}`,
		`printf '\\n[Polywise] Starting ${label} login...\\n\\n'`,
		command,
		`printf '\\n[Polywise] ${label} login command finished. You can close this window.\\n'`,
		`exec ${quotePosix(shell_path)} -l`
	].join('; ')
}

const openMacTerminal = async (args: { label: string; command: string }) => {
	const interactive_command = buildInteractiveShellCommand(args)
	const script = `tell application "Terminal"
activate
do script ${JSON.stringify(interactive_command)}
end tell`

	await new Promise<void>((resolve, reject) => {
		const child = spawn('osascript', ['-e', script], {
			shell: false,
			env: getRuntimeCommandEnv()
		})
		let stderr = ''

		child.stderr?.on('data', chunk => {
			stderr += String(chunk)
		})

		child.on('error', reject)
		child.on('close', code => {
			if (code === 0) {
				resolve()
				return
			}

			reject(new Error(stderr.trim() || 'Failed to open Terminal.'))
		})
	})
}

const openWindowsTerminal = async (args: { label: string; command: string }) => {
	const env = getRuntimeCommandEnv()
	const command = `start "${args.label}" cmd /k "${args.command}"`

	await new Promise<void>((resolve, reject) => {
		const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
			shell: false,
			env,
			detached: true,
			stdio: 'ignore'
		})

		child.on('error', reject)
		child.on('spawn', () => {
			child.unref()
			resolve()
		})
	})
}

const getLinuxTerminalLauncher = async () => {
	const terminal_definitions = [
		{ command: 'x-terminal-emulator', buildArgs: (script: string) => ['-e', 'sh', '-lc', script] },
		{ command: 'gnome-terminal', buildArgs: (script: string) => ['--', 'sh', '-lc', script] },
		{ command: 'konsole', buildArgs: (script: string) => ['-e', 'sh', '-lc', script] },
		{ command: 'xfce4-terminal', buildArgs: (script: string) => ['--command', `sh -lc ${quotePosix(script)}`] },
		{ command: 'kitty', buildArgs: (script: string) => ['sh', '-lc', script] }
	] as const

	for (const terminal of terminal_definitions) {
		if (await resolveCommand(terminal.command)) {
			return terminal
		}
	}

	return null
}

const openLinuxTerminal = async (args: { label: string; command: string }) => {
	const terminal = await getLinuxTerminalLauncher()

	if (!terminal) {
		throw new Error('No supported Linux terminal emulator was found for interactive OAuth login.')
	}

	const env = getRuntimeCommandEnv()
	const interactive_command = buildInteractiveShellCommand(args)

	await new Promise<void>((resolve, reject) => {
		const child = spawn(terminal.command, terminal.buildArgs(interactive_command), {
			shell: false,
			env,
			detached: true,
			stdio: 'ignore'
		})

		child.on('error', reject)
		child.on('spawn', () => {
			child.unref()
			resolve()
		})
	})
}

export const launchInteractiveLogin = async (args: { label: string; command: string }) => {
	if (process.platform === 'darwin') {
		await openMacTerminal(args)
		return
	}

	if (process.platform === 'win32') {
		await openWindowsTerminal(args)
		return
	}

	await openLinuxTerminal(args)
}

export const runShellCommand = async (command: string, timeout = 10000) => {
	const shell = process.env.SHELL ?? '/bin/sh'
	const env = getRuntimeCommandEnv()

	return await new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const stdout_chunks = [] as Array<string>
		const stderr_chunks = [] as Array<string>
		let settled = false
		const use_windows_shell = process.platform === 'win32'

		const child = use_windows_shell
			? spawn('cmd', ['/d', '/s', '/c', command], {
					shell: false,
					env
				})
			: spawn(shell, ['-lc', command], {
					shell: false,
					env
				})

		const timer = setTimeout(() => {
			if (settled) {
				return
			}

			settled = true
			child.kill('SIGKILL')
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join('') || `Command timed out after ${timeout}ms`,
				exitCode: 124
			})
		}, timeout)

		child.stdout?.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr?.on('data', chunk => {
			stderr_chunks.push(String(chunk))
		})

		child.on('error', error => {
			if (settled) {
				return
			}

			settled = true
			clearTimeout(timer)
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: error.message || stderr_chunks.join(''),
				exitCode: 1
			})
		})

		child.on('close', code => {
			if (settled) {
				return
			}

			settled = true
			clearTimeout(timer)
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join(''),
				exitCode: code ?? 1
			})
		})
	})
}

export const parseCodexStatusLabel = (output: string) => {
	const cleaned_output = stripAnsi(output).trim()

	if (!cleaned_output) {
		return null
	}

	const lines = cleaned_output
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)

	return lines[0] ?? cleaned_output
}

export const parseOpenCodeCredentials = (output: string) => {
	const lines = stripAnsi(output)
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
	const credentials = [] as Array<{ name: string; method: string }>
	let in_credentials = false

	for (const line of lines) {
		const normalized_line = line.replace(/^[┌└│\s]+/u, '').trim()

		if (normalized_line.startsWith('Credentials')) {
			in_credentials = true
			continue
		}

		if (!in_credentials) {
			continue
		}

		if (normalized_line.startsWith('Environment')) {
			break
		}

		const matched_credential = /^●\s+(.+?)\s+(api|oauth)\s*$/i.exec(normalized_line)

		if (matched_credential) {
			credentials.push({
				name: matched_credential[1] || '',
				method: (matched_credential[2] || '').toLowerCase()
			})
		}
	}

	return credentials
}

export const readJsonFile = async <T>(file_path: string) => {
	try {
		return (await fs.readJson(file_path)) as T
	} catch {
		return null as T | null
	}
}

export const readOpenCodeAuthFile = async () => {
	const auth_path = path.resolve(os.homedir(), '.local/share/opencode/auth.json')

	return readJsonFile<Record<string, { key?: string; type?: string }>>(auth_path)
}

const normalizeModelName = (value: string) =>
	value
		.split(/[/-]/g)
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')

export const parseOpenCodeModels = (output: string) => {
	return stripAnsi(output)
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const parts = line.split('/')
			const model_id = parts[parts.length - 1] || line

			return {
				id: model_id,
				name: normalizeModelName(model_id),
				enabled: true
			} satisfies Model
		})
}

export const readProviderConfigFile = async (file_path: string) => {
	return (await readJsonFile<ProviderConfig>(file_path)) ?? { providers: [] }
}
