import { spawn } from 'child_process'
import path from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { createSystemSpec, getPathMappings, getRealPath, getSystemToolsPrompt } from '../utils'

import type Session from '../session'

const MAX_OUTPUT_LENGTH = 30_000

const truncateOutput = (output: string, stream_name: 'stdout' | 'stderr') => {
	if (output.length <= MAX_OUTPUT_LENGTH) {
		return output
	}

	const truncated_length = output.length - MAX_OUTPUT_LENGTH

	return `${output.slice(0, MAX_OUTPUT_LENGTH)}\n\n[${stream_name} truncated: ${truncated_length} characters removed]`
}

const getMountPrompt = (s: Session) => {
	const mounts = [] as Array<string>

	if (s.skills_dir) {
		mounts.push(`- /skills -> ${s.skills_dir}`)
	}

	for (const mount of s.additional_mounts) {
		mounts.push(`- ${mount.mountPoint} -> ${mount.path}`)
	}

	if (!mounts.length) {
		return ''
	}

	return [
		'Mounted path aliases for helper tools:',
		...mounts,
		'For bash_tool, use the real host paths above.'
	].join('\n')
}

const executeShellCommand = async (command: string, cwd: string) => {
	if (process.platform === 'win32') {
		return new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
			const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
				cwd,
				env: process.env
			})
			let stdout = ''
			let stderr = ''

			child.stdout?.on('data', chunk => {
				stdout += String(chunk)
			})
			child.stderr?.on('data', chunk => {
				stderr += String(chunk)
			})
			child.on('error', err => {
				resolve({ stdout: '', stderr: err.message, exitCode: 1 })
			})
			child.on('close', code => {
				resolve({
					stdout: truncateOutput(stdout, 'stdout'),
					stderr: truncateOutput(stderr, 'stderr'),
					exitCode: code ?? 0
				})
			})
		})
	}

	return new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const child = spawn(process.env.SHELL ?? '/bin/sh', ['-lc', command], {
			cwd,
			env: process.env
		})
		let stdout = ''
		let stderr = ''

		child.stdout?.on('data', chunk => {
			stdout += String(chunk)
		})
		child.stderr?.on('data', chunk => {
			stderr += String(chunk)
		})
		child.on('error', err => {
			resolve({ stdout: '', stderr: err.message, exitCode: 1 })
		})
		child.on('close', code => {
			resolve({
				stdout: truncateOutput(stdout, 'stdout'),
				stderr: truncateOutput(stderr, 'stderr'),
				exitCode: code ?? 0
			})
		})
	})
}

export const createNativeAccessTools = async (s: Session) => {
	const system_tools_prompt = getSystemToolsPrompt(createSystemSpec())
	const path_mappings = getPathMappings(s)
	const shared_description = [
		'This tool runs directly on the host system without just-bash sandboxing, approval, or audit filters.',
		system_tools_prompt,
		getMountPrompt(s)
	]
		.filter(Boolean)
		.join('\n\n')

	const bash = tool({
		description: [
			'Execute shell commands directly on the host system.',
			`WORKING DIRECTORY: ${s.cwd}`,
			'All commands execute from this directory unless you change directories in the command itself.',
			shared_description
		]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			command: string().describe('The shell command to execute')
		}),
		execute: async ({ command }) => executeShellCommand(command, s.cwd)
	})

	const readFileTool = tool({
		description: ['Read a file directly from the host system.', shared_description]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			path: string().describe('The absolute or relative path to the file to read')
		}),
		execute: async ({ path: file_path }) => {
			const real_path = getRealPath(s.cwd, file_path, path_mappings)
			const content = await readFile(real_path, 'utf8')

			return { content }
		}
	})

	const writeFileTool = tool({
		description: [
			'Write a file directly to the host system. Creates parent directories if needed.',
			shared_description
		]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			path: string().describe('The absolute or relative path where the file should be written'),
			content: string().describe('The content to write to the file')
		}),
		execute: async ({ path: file_path, content }) => {
			const real_path = getRealPath(s.cwd, file_path, path_mappings)

			await fs.ensureDir(path.dirname(real_path))
			await writeFile(real_path, content, 'utf8')

			return { success: true }
		}
	})

	return {
		bash,
		readFile: readFileTool,
		writeFile: writeFileTool
	}
}
