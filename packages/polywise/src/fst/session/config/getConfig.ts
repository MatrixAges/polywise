import { to } from 'await-to-js'
import fs from 'fs-extra'

import type { SessionAuditMode, SessionMode } from '../../types'
import type Index from '../index'

const valid_modes = ['normal', 'plan', 'plan-exec'] as const
const valid_audit_modes = ['limited', 'auto', 'full'] as const

export default async (s: Index) => {
	const [err, res] = await to(fs.readJSON(s.config_dir))

	if (!err && res && typeof res === 'object') {
		const disable_map = (res as { disable_map?: unknown }).disable_map
		const mode = (res as { mode?: unknown }).mode
		const audit_mode = (res as { audit_mode?: unknown }).audit_mode

		const valid_disable_map = Array.isArray(disable_map)
			? (disable_map.filter(value => typeof value === 'string') as Array<string>)
			: ([] as Array<string>)

		const valid_mode = valid_modes.includes(mode as SessionMode) ? (mode as SessionMode) : 'normal'
		const valid_audit_mode = valid_audit_modes.includes(audit_mode as SessionAuditMode)
			? (audit_mode as SessionAuditMode)
			: 'auto'

		return {
			disable_map: valid_disable_map,
			mode: valid_mode,
			audit_mode: valid_audit_mode
		}
	}

	return {
		disable_map: [] as Array<string>,
		mode: 'normal' as SessionMode,
		audit_mode: 'auto' as SessionAuditMode
	}
}
