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

export const extractTitleFromContent = (content: string) => {
	const lines = content
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.slice(0, 20)

	for (const line of lines) {
		if (/^(URL Source|Published Time|Markdown Content)\s*:/i.test(line)) {
			continue
		}

		const candidate = line
			.replace(/^#{1,6}\s+/, '')
			.replace(/^Title\s*:\s*/i, '')
			.replace(/^\*\*(.+)\*\*$/, '$1')
			.trim()

		if (!candidate) {
			continue
		}

		if (/^https?:\/\//i.test(candidate)) {
			continue
		}

		if (candidate.length < 3 || candidate.length > 200) {
			continue
		}

		return candidate
	}

	return ''
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
