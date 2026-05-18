import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { createSystemSpec, getPathMappings, getRealPath, getSystemToolsPrompt } from '../utils'

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

const getPathAnchorPrompt = (s: Session, host_cwd: string) => {
	const lines = [
		'Path anchors:',
		`- user home directory -> ${USER_HOME_DIR}`,
		`- default working directory -> ${host_cwd}`,
		`- session scratch directory -> ${s.files_dir}`,
		`- legacy virtual root / -> ${s.cwd}`
	] as Array<string>

	if (s.project?.dir) {
		lines.push(`- project root -> ${s.project.dir}`)
	}

	if (s.skills_dir) {
		lines.push(`- /skills -> ${s.skills_dir}`)
	}

	for (const mount of s.additional_mounts) {
		lines.push(`- ${mount.mountPoint} -> ${mount.path}`)
	}

	return lines.join('\n')
}

const getAccessPrompt = (s: Session, host_cwd: string) => {
	return [
		'Full host access is enabled.',
		'You are not restricted to the default working directory. It only controls how relative paths are resolved.',
		'If the default working directory looks like a session scratch area, do not treat it as the main target automatically.',
		'You may read, write, and execute against any absolute host path on disk.',
		'When you need a broad filesystem starting point, begin from the user home directory or another explicit absolute path.',
		'When the target is outside the default working directory, use an absolute host path directly.',
		'For bash_tool, prefer the real host paths below instead of assuming virtual mounted paths exist in the shell.',
		getPathAnchorPrompt(s, host_cwd),
		'Environment variables exposed to shell commands:',
		'- POLYWISE_USER_HOME',
		'- POLYWISE_DEFAULT_CWD',
		'- POLYWISE_SESSION_FILES_DIR',
		'- POLYWISE_VIRTUAL_ROOT',
		'- POLYWISE_PATH_MAPPINGS_JSON'
	].join('\n')
}

const getCommandEnv = (s: Session, host_cwd: string) => ({
	...process.env,
	POLYWISE_USER_HOME: USER_HOME_DIR,
	POLYWISE_DEFAULT_CWD: host_cwd,
	POLYWISE_SESSION_FILES_DIR: s.files_dir,
	POLYWISE_VIRTUAL_ROOT: s.cwd,
	POLYWISE_PATH_MAPPINGS_JSON: JSON.stringify(s.path_mappings)
})

const executeShellCommand = async (command: string, cwd: string, env: NodeJS.ProcessEnv) => {
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
		const child = spawn(process.env.SHELL ?? '/bin/sh', ['-lc', command], {
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
		getAccessPrompt(s, host_cwd)
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
			const real_path = getRealPath(host_cwd, file_path, path_mappings)
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
			const real_path = getRealPath(host_cwd, file_path, path_mappings)

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
