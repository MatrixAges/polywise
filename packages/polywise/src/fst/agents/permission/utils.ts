import { minimatch } from 'minimatch'

import getRealPath from '../../utils/getRealPath'

import type { Permission } from '../../types'

export const is_env_file = (path: string): boolean => {
	const basename = path.split('/').pop() || ''

	return basename === '.env' || basename.startsWith('.env.') || minimatch(basename, '*.env*')
}

export const is_path_in_dir = (path: string, dir: string): boolean => {
	const normalized_path = path.replace(/\\/g, '/')
	const normalized_dir = dir.replace(/\\/g, '/').replace(/\/$/, '')

	return normalized_path.startsWith(normalized_dir + '/') || normalized_path === normalized_dir
}

export const match_permission = (permission: Permission, tool: string, action: string, path: string): boolean => {
	if (permission.tool !== tool) {
		return false
	}

	if (permission.action !== action) {
		return false
	}

	return minimatch(path, permission.path) || is_path_in_dir(path, permission.path)
}

const shell_token_pattern = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+/g

const trimShellToken = (token: string) => {
	const trimmed_token = token.trim().replace(/^[|&;]+|[|&;]+$/g, '')

	return trimmed_token.replace(/^['"]|['"]$/g, '')
}

const isIgnoredShellToken = (token: string) => {
	if (!token) return true
	if (token === '|' || token === '||' || token === '&&' || token === ';') return true
	if (token.startsWith('-')) return true
	if (/^[A-Za-z]+:\/\//.test(token)) return true

	return false
}

const isVirtualPathToken = (token: string) => {
	if (token === '/' || token === '.' || token === '..') return true
	if (token.startsWith('./') || token.startsWith('../')) return true
	if (token.startsWith('/')) return true
	if (token.includes('/')) return true

	return false
}

const resolveCommandPath = (args: { cwd: string; token: string; path_mappings: Record<string, string> }) => {
	const { cwd, token, path_mappings } = args

	if (token.startsWith('~/') || token === '~' || token.startsWith('$HOME') || token.startsWith('${HOME}')) {
		return null
	}

	if (!isVirtualPathToken(token)) {
		return undefined
	}

	return getRealPath(cwd, token, path_mappings)
}

export const isBashCommandInAllowedRoots = (args: {
	command: string
	cwd: string
	path_mappings: Record<string, string>
	allowed_roots: Array<string>
}) => {
	const { command, cwd, path_mappings, allowed_roots } = args
	const tokens = command.match(shell_token_pattern) || []
	const resolved_paths = [] as Array<string>

	for (const token of tokens) {
		const normalized_token = trimShellToken(token)

		if (isIgnoredShellToken(normalized_token)) {
			continue
		}

		const resolved_path = resolveCommandPath({
			cwd,
			token: normalized_token,
			path_mappings
		})

		if (resolved_path === null) {
			return false
		}

		if (resolved_path) {
			resolved_paths.push(resolved_path)
		}
	}

	if (resolved_paths.length === 0) {
		return true
	}

	return resolved_paths.every(target_path => allowed_roots.some(root => is_path_in_dir(target_path, root)))
}

export const is_system_config_file = (path: string): boolean => {
	const sensitive_patterns = [
		'/etc/',
		'/usr/',
		'/var/',
		'/sys/',
		'/proc/',
		'/dev/',
		'/root/',
		'~/.ssh/',
		'~/.aws/',
		'~/.gnupg/',
		'/etc/passwd',
		'/etc/shadow',
		'/etc/group'
	]

	return sensitive_patterns.some(pattern => path.includes(pattern))
}

export const is_destructive_command = (command: string): boolean => {
	const destructive_patterns = [
		/^rm\s+-rf?\s+/,
		/^chmod\s+/,
		/^chown\s+/,
		/^dd\s+if=/,
		/^mkfs\./,
		/^fdisk\s+/,
		/^mount\s+/,
		/^umount\s+/,
		/^kill\s+/,
		/^killall\s+/,
		/^pkill\s+/
	]

	return destructive_patterns.some(pattern => pattern.test(command))
}
