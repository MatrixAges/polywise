import { getEnabledAgentToolNames } from '@core/db/agentTool'

import readCustomToolsMap from './read'
import scanCustomToolsMap from './scan'

import type Session from '../../session'

export default async (s: Session) => {
	if (s.owner_agent) {
		const enabled_tool_names = new Set(getEnabledAgentToolNames(s.owner_agent.tools))

		if (enabled_tool_names.size === 0) {
			s.custom_tools_map = []

			return s.custom_tools_map
		}

		const tool_items = await scanCustomToolsMap(s.tools_dir)

		s.custom_tools_map = tool_items.filter(item => enabled_tool_names.has(item.name))

		return s.custom_tools_map
	}

	return readCustomToolsMap(s)
}
