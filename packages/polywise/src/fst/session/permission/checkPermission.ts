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

export default (s: Index, tool: string, action: string, path: string): 'allowed' | 'denied' | 'needs_approval' => {
	if (is_env_file(path)) {
		const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

		if (has_permission) {
			return 'allowed'
		}

		return 'needs_approval'
	}

	if (is_path_in_dir(path, s.files_dir)) return 'allowed'

	if (s.project && is_path_in_dir(path, s.project.dir)) {
		return 'allowed'
	}

	const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

	if (has_permission) return 'allowed'

	return 'needs_approval'
}
