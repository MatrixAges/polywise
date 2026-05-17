import { spawn } from 'child_process'
import TurndownService from 'turndown'

import { getRuntimeCommandEnv, resolveCommand } from '../utils/resolveCommand'

const turndown = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	emDelimiter: '*'
})

turndown.remove(['script', 'style', 'meta', 'link', 'noscript'])

export const htmlToMarkdown = (html: string) => {
	return turndown.turndown(html)
}

export const trimContent = (content: string, max_chars: number) => {
	const normalized_content = content.trim()

	return {
		content: normalized_content.slice(0, max_chars),
		truncated: normalized_content.length > max_chars
	}
}

export const getErrorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : 'Unknown error'
}

export const runCommand = async (command: string, args: Array<string>, timeout = 30000) => {
	const resolved_command = await resolveCommand(command)
	const env = getRuntimeCommandEnv()

	if (!resolved_command) {
		return {
			stdout: '',
			stderr: `Command not found: ${command}`,
			exitCode: 127
		}
	}

	return await new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const stdout_chunks: Array<string> = []
		const stderr_chunks: Array<string> = []
		let settled = false

		const child = spawn(resolved_command, args, {
			shell: false,
			env
		})

		const timer = setTimeout(() => {
			if (settled) return

			settled = true
			child.kill('SIGKILL')

			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join('') || `Command timed out after ${timeout}ms`,
				exitCode: 124
			})
		}, timeout)

		child.stdout.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr.on('data', chunk => {
			stderr_chunks.push(String(chunk))
		})

		child.on('error', error => {
			if (settled) return

			settled = true
			clearTimeout(timer)

			resolve({
				stdout: stdout_chunks.join(''),
				stderr: error.message || stderr_chunks.join(''),
				exitCode: 1
			})
		})

		child.on('close', code => {
			if (settled) return

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
