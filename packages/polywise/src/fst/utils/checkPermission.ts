import { approve, check } from '../agents'
import { detectShellInjectionRisk } from './safeshell'

import type Session from '../session'

export default async (
	s: Session,
	tool: string,
	action: string,
	path: string,
	shell_injection_path?: string,
	skip_check?: boolean
) => {
	if (s.audit_mode === 'full') {
		return null
	}

	if (shell_injection_path && detectShellInjectionRisk(shell_injection_path)) {
		const is_approved = await approve(
			s,
			'bash',
			'execute',
			`${action}_${tool} (RISKY!): ${shell_injection_path}`
		)

		if (!is_approved) return 'Shell injection risk detected in path'
	}

	if (!skip_check) {
		const result = check(s, tool, action, path)

		if (result === 'needs_approval') {
			const is_approved = await approve(s, tool, action, path)

			if (!is_approved) return `Permission denied for ${action} ${path}`
		}
	} else {
		const is_approved = await approve(s, tool, action, path)

		if (!is_approved) return `Permission denied for ${action} ${path}`
	}

	return null
}
