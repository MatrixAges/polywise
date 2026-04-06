import { minimatch } from 'minimatch'

import type Index from '../../session'

export const isPathInDir = (target_path: string, dir: string): boolean => {
	const normalized_path = target_path.replace(/\\/g, '/')
	const normalized_dir = dir.replace(/\\/g, '/').replace(/\/$/, '')

	return normalized_path.startsWith(normalized_dir + '/') || normalized_path === normalized_dir
}

export const hasReadPermission = (s: Index, path: string): boolean => {
	return s.permissions.some(p => {
		if (p.tool !== 'file' || p.action !== 'read') return false

		return minimatch(path, p.path) || isPathInDir(path, p.path)
	})
}
