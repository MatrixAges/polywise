import { is_destructive_command, is_env_file, is_path_in_dir, is_system_config_file, match_permission } from './utils'

import type Session from '../../session'

export default (s: Session, tool: string, action: string, path: string): 'allowed' | 'denied' | 'needs_approval' => {
	if (is_env_file(path)) {
		const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

		if (has_permission) return 'allowed'

		return 'needs_approval'
	}

	if (is_system_config_file(path)) {
		return 'needs_approval'
	}

	if (tool === 'bash' && is_destructive_command(path)) {
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
