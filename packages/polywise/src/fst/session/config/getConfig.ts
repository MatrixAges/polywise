import { getDisabledAgentToolNames } from '@core/db/agentTool'
import { configurable_session_tool_items } from '@core/fst/session/config/shared'
import { to } from 'await-to-js'
import fs from 'fs-extra'

import { default_session_runtime_config, normalizeSessionRuntimeConfig } from './shared'

import type Index from '../index'

export default async (s: Index) => {
	const runtime_tool_name_set = new Set<string>([
		...configurable_session_tool_items.map(item => item.key),
		'agent_tool',
		'system_tool'
	])
	const [err, res] = await to(fs.readJSON(s.config_dir))
	const owner_agent_disable_map = s.owner_agent
		? getDisabledAgentToolNames(s.owner_agent.tools).filter(item => runtime_tool_name_set.has(item))
		: []

	if (!err && res && typeof res === 'object') {
		const config = normalizeSessionRuntimeConfig(res as any)

		return normalizeSessionRuntimeConfig({
			...config,
			disable_map: config.disable_map.concat(owner_agent_disable_map)
		})
	}

	return normalizeSessionRuntimeConfig({
		...default_session_runtime_config,
		disable_map: owner_agent_disable_map
	})
}
