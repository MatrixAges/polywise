import type { McpConfig, McpLocalConfig, McpRemoteConfig } from './types'

type McpServerConfig = McpLocalConfig | McpRemoteConfig

export default (mcp_config: McpConfig, disable_map: Array<string>) => {
	if (mcp_config.enabled === false) {
		return [] as Array<[string, McpServerConfig]>
	}

	const enabled_mcps: Array<[string, McpServerConfig]> = []

	for (const [name, mcp_item] of Object.entries(mcp_config)) {
		if (name === 'enabled') {
			continue
		}

		if (!mcp_item || typeof mcp_item !== 'object' || Array.isArray(mcp_item)) {
			continue
		}

		const is_enabled = mcp_item.enabled ?? true

		if (!is_enabled) {
			continue
		}

		if (disable_map.includes(name)) {
			continue
		}

		enabled_mcps.push([name, mcp_item])
	}

	return enabled_mcps
}
