import { minimatch } from 'minimatch'

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
