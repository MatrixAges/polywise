import { getConfig } from '../session/config'
import getEnabledMcps from './getEnabledMcps'
import { mcp_client_map } from './initMcps'
import loadConfig from './loadConfig'

import type Session from '../session'

export default async (s: Session) => {
	const mcp_config = loadConfig()
	const session_config = await getConfig(s)
	const enabled_mcps = getEnabledMcps(mcp_config, session_config.disable_map)
	const tools: Record<string, unknown> = {}

	for (const [name, item] of enabled_mcps) {
		let client = mcp_client_map.get(name)

		if (!client) {
			const { default: createMcpClient } = await import('./createMcpClient')
			client = await createMcpClient(item)
			mcp_client_map.set(name, client)
		}

		const mcp_tools = await client.tools()

		for (const [tool_name, mcp_tool] of Object.entries(mcp_tools)) {
			tools[`${name}_${tool_name}`] = mcp_tool
		}
	}

	return tools
}
