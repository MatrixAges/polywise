import type { SessionRuntimeConfig } from '../config/shared'
import type Index from '../index'

export default async (s: Index, config?: SessionRuntimeConfig) => {
	const next = config ?? (await s.getConfig())

	s.disable_map = next.disable_map
	s.mode = next.mode
	s.audit_mode = next.audit_mode
	s.enable_sub_agent = next.enable_sub_agent
	s.sub_agent_keys = next.sub_agent_keys
	s.enable_agent_tool = next.enable_agent_tool
	s.agent_ids = next.agent_ids

	return next
}
