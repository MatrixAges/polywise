import { minimatch } from 'minimatch'

import type { Permission } from '../../types'
import type Index from '../index'

const is_env_file = (path: string): boolean => {
	const basename = path.split('/').pop() || ''

	return basename === '.env' || basename.startsWith('.env.') || minimatch(basename, '*.env*')
}

const is_path_in_dir = (path: string, dir: string): boolean => {
	const normalized_path = path.replace(/\\/g, '/')
	const normalized_dir = dir.replace(/\\/g, '/').replace(/\/$/, '')

	return normalized_path.startsWith(normalized_dir + '/') || normalized_path === normalized_dir
}

const match_permission = (permission: Permission, tool: string, action: string, path: string): boolean => {
	if (permission.tool !== tool) {
		return false
	}

	if (permission.action !== action) {
		return false
	}

	return minimatch(path, permission.path) || is_path_in_dir(path, permission.path)
}

const is_system_config_file = (path: string): boolean => {
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

const is_destructive_command = (command: string): boolean => {
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

export default (s: Index, tool: string, action: string, path: string): 'allowed' | 'denied' | 'needs_approval' => {
	// 检查是否是.env文件（需要审核）
	if (is_env_file(path)) {
		const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

		if (has_permission) {
			return 'allowed'
		}

		return 'needs_approval'
	}

	// 检查是否是系统配置文件（需要审核）
	if (is_system_config_file(path)) {
		return 'needs_approval'
	}

	// 检查是否是破坏性命令（需要审核）
	if (tool === 'bash' && is_destructive_command(path)) {
		return 'needs_approval'
	}

	// 对于session files目录的操作，直接放行
	if (is_path_in_dir(path, s.files_dir)) return 'allowed'

	// 对于项目目录的操作，直接放行
	if (s.project && is_path_in_dir(path, s.project.dir)) {
		return 'allowed'
	}

	// 对于已有权限的操作，直接放行
	const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

	if (has_permission) return 'allowed'

	// 其他情况，需要审核
	return 'needs_approval'
}
