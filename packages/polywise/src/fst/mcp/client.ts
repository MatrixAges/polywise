import createMcpClient from './createMcpClient'

import type { MCPClient } from '@ai-sdk/mcp'
import type { McpLocalConfig, McpRemoteConfig } from './types'

type McpServerConfig = McpLocalConfig | McpRemoteConfig

const mcp_client_map = new Map<string, Promise<MCPClient>>()

export const hasMcpClient = (name: string) => mcp_client_map.has(name)

export const getMcpClient = (name: string, config: McpServerConfig) => {
	let client = mcp_client_map.get(name)

	if (!client) {
		client = createMcpClient(config).catch(error => {
			mcp_client_map.delete(name)
			throw error
		})
		mcp_client_map.set(name, client)
	}

	return client
}

export const clearMcpClient = (name: string) => {
	mcp_client_map.delete(name)
}

export { mcp_client_map }
