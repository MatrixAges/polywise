import fs from 'fs-extra'

import getConfig from './getConfig'

import type { SessionAuditMode, SessionMode } from '../../types'
import type Index from '../index'

export default async (
	s: Index,
	patch: Partial<{ disable_map: Array<string>; mode: SessionMode; audit_mode: SessionAuditMode }>
) => {
	const current = await getConfig(s)
	const next = { ...current, ...patch }

	await fs.writeJSON(s.config_dir, next, { spaces: 4 })

	if (patch.mode) s.mode = patch.mode
	if (patch.audit_mode) s.audit_mode = patch.audit_mode

	return next
}
