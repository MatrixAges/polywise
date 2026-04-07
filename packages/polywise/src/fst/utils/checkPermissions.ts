import { approve, check } from '../agents'
import { detectShellInjectionRisk } from './safeshell'

import type Session from '../session'

export default async (s: Session, file_path: string, real_path: string) => {
	if (detectShellInjectionRisk(file_path)) {
		const is_approved = await approve(s, 'bash', 'execute', `edit_file (RISKY!): ${file_path}`)

		if (!is_approved) return 'Shell injection risk detected in path'
	}

	const read_result = check(s, 'edit', 'read', real_path)

	if (read_result === 'needs_approval') {
		const is_approved = await approve(s, 'edit', 'read', real_path)

		if (!is_approved) return 'Permission denied for reading file'
	}

	const write_result = check(s, 'edit', 'write', real_path)

	if (write_result === 'needs_approval') {
		const is_approved = await approve(s, 'edit', 'write', real_path)
		if (!is_approved) return 'Permission denied for writing file'
	}

	return null
}
