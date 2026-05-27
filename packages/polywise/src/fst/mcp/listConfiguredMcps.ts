import getEnabledMcps from './getEnabledMcps'
import loadConfig from './loadConfig'

import type { McpLocalConfig, McpRemoteConfig } from './types'

const getRemoteOrigin = (url: string) => {
	try {
		return new URL(url).origin
	} catch {
		return url
	}
}

const getDescription = (name: string, config: McpLocalConfig | McpRemoteConfig) => {
	if (config.type === 'local') {
		const command = config.command.join(' ').trim()

		return command ? `Local MCP server via ${command}` : `Local MCP server ${name}`
	}

	return `Remote MCP server at ${getRemoteOrigin(config.url)}`
}

export default (disable_map: Array<string>) => {
	const mcp_config = loadConfig()

	return getEnabledMcps(mcp_config, disable_map).map(([name, config]) => ({
		...config,
		name,
		description: getDescription(name, config)
	}))
}
