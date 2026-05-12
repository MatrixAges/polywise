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

	for (const root of [s.cwd, s.files_dir, s.project?.dir, ...s.additional_mounts.map(item => item.path)].filter(
		Boolean
	) as Array<string>) {
		if (is_path_in_dir(path, root)) {
			return 'allowed'
		}
	}

	const has_permission = s.permissions.some(p => match_permission(p, tool, action, path))

	if (has_permission) return 'allowed'

	return 'needs_approval'
}
