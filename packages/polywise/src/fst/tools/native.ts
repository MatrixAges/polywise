import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import { getNativeAccessPrompt } from '@core/consts/prompts/getNativePrompt'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { createSystemSpec, getPathMappings, getSystemToolsPrompt } from '../utils'

import type Session from '../session'

const MAX_OUTPUT_LENGTH = 30_000
const USER_HOME_DIR = os.homedir()

const getHostWorkingDir = (s: Session) => {
	if (s.project?.dir) {
		return s.project.dir
	}

	if (s.cwd === s.files_dir) {
		const first_mount = s.additional_mounts[0]?.path

		if (first_mount) {
			return first_mount
		}
	}

	return s.cwd
}

const truncateOutput = (output: string, stream_name: 'stdout' | 'stderr') => {
	if (output.length <= MAX_OUTPUT_LENGTH) {
		return output
	}

	const truncated_length = output.length - MAX_OUTPUT_LENGTH

	return `${output.slice(0, MAX_OUTPUT_LENGTH)}\n\n[${stream_name} truncated: ${truncated_length} characters removed]`
}

const getCommandEnv = (s: Session, host_cwd: string) => ({
	...process.env,
	POLYWISE_USER_HOME: USER_HOME_DIR,
	POLYWISE_DEFAULT_CWD: host_cwd,
	POLYWISE_SESSION_FILES_DIR: s.files_dir,
	POLYWISE_VIRTUAL_ROOT: s.cwd,
	POLYWISE_PATH_MAPPINGS_JSON: JSON.stringify(s.path_mappings)
})

const buildShellCommand = (command: string) => {
	return `set -o pipefail 2>/dev/null\n${command}`
}

const getDirectoryReadError = async (real_path: string) => {
	const entries = await fs.readdir(real_path).catch(() => [])
	const preview = entries.slice(0, 12)
	const suggestion_lines = [
		`Path is a directory, not a file: ${real_path}`,
		'Use glob_tool to list files in this directory by name or pattern.',
		'Use search_file_tool to search inside files under this directory.',
		'Use bash_tool with ls when you need raw directory structure output.'
	]

	if (preview.length > 0) {
		suggestion_lines.push(`Directory entries preview: ${preview.join(', ')}`)
	}

	return suggestion_lines.join('\n')
}

const resolveHostPath = (args: { host_cwd: string; file_path: string; path_mappings: Record<string, string> }) => {
	const { host_cwd, file_path, path_mappings } = args

	const mapping_list = Object.entries(path_mappings).sort((left, right) => right[0].length - left[0].length)

	for (const [prefix, real_dir] of mapping_list) {
		if (file_path === prefix || file_path.startsWith(`${prefix}/`)) {
			const relative_path = file_path.slice(prefix.length).replace(/^\/+/, '')

			return path.resolve(real_dir, relative_path || '.')
		}
	}

	if (path.isAbsolute(file_path)) {
		return path.resolve(file_path)
	}

	return path.resolve(host_cwd, file_path)
}

const executeShellCommand = async (command: string, cwd: string, env: NodeJS.ProcessEnv) => {
	const shell_command = buildShellCommand(command)

	if (process.platform === 'win32') {
		return new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
			const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
				cwd,
				env
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
		const child = spawn(process.env.SHELL ?? '/bin/sh', ['-lc', shell_command], {
			cwd,
			env
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
	const host_cwd = getHostWorkingDir(s)
	const path_mappings = getPathMappings(s)
	const command_env = getCommandEnv(s, host_cwd)
	const shared_description = [
		'This tool runs directly on the host system without just-bash sandboxing, approval, or audit filters.',
		system_tools_prompt,
		getNativeAccessPrompt({
			user_home_dir: USER_HOME_DIR,
			host_cwd,
			files_dir: s.files_dir,
			virtual_root: s.cwd,
			project_dir: s.project?.dir,
			skills_dir: s.skills_dir,
			additional_mounts: s.additional_mounts
		})
	]
		.filter(Boolean)
		.join('\n\n')

	const bash = tool({
		description: [
			'Execute shell commands directly on the host system.',
			`WORKING DIRECTORY: ${host_cwd}`,
			'All commands execute from this directory unless you change directories in the command itself.',
			shared_description
		]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			command: string().describe('The shell command to execute')
		}),
		execute: async ({ command }) => executeShellCommand(command, host_cwd, command_env)
	})

	const readFileTool = tool({
		description: [
			'Read a file directly from the host system. Relative paths resolve from the default working directory; absolute paths may point anywhere on disk.',
			shared_description
		]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			path: string().describe('The absolute or relative path to the file to read')
		}),
		execute: async ({ path: file_path }) => {
			const real_path = resolveHostPath({ host_cwd, file_path, path_mappings })
			const stat = await fs.stat(real_path)

			if (stat.isDirectory()) {
				throw new Error(await getDirectoryReadError(real_path))
			}

			const content = await readFile(real_path, 'utf8')

			return { content }
		}
	})

	const writeFileTool = tool({
		description: [
			'Write a file directly to the host system. Creates parent directories if needed. Relative paths resolve from the default working directory; absolute paths may point anywhere on disk.',
			shared_description
		]
			.filter(Boolean)
			.join('\n\n'),
		inputSchema: object({
			path: string().describe('The absolute or relative path where the file should be written'),
			content: string().describe('The content to write to the file')
		}),
		execute: async ({ path: file_path, content }) => {
			const real_path = resolveHostPath({ host_cwd, file_path, path_mappings })

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
