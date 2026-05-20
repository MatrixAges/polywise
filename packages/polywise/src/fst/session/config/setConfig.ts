import fs from 'fs-extra'

import getConfig from './getConfig'
import { normalizeSessionRuntimeConfig } from './shared'

import type Index from '../index'

export default async (s: Index, patch: Partial<Awaited<ReturnType<typeof getConfig>>>) => {
	const current = await getConfig(s)
	const next = normalizeSessionRuntimeConfig({ ...current, ...patch })

	await fs.writeJSON(s.config_dir, next, { spaces: 4 })

	s.disable_map = next.disable_map
	s.mode = next.mode
	s.audit_mode = next.audit_mode
	s.enable_sub_agent = next.enable_sub_agent
	s.enable_agent_tool = next.enable_agent_tool
	s.agent_ids = next.agent_ids

	return next
}
