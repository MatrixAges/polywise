import { createMCPClient } from '@ai-sdk/mcp'
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio'

import type { MCPClient } from '@ai-sdk/mcp'
import type { McpLocalConfig, McpRemoteConfig } from '@core/types'

const createStdioTransport = (mcp_config: McpLocalConfig) => {
	return new Experimental_StdioMCPTransport({
		command: mcp_config.command[0],
		args: mcp_config.command.slice(1),
		env: mcp_config.environment,
		cwd: undefined
	})
}

const createHttpTransport = (mcp_config: McpRemoteConfig) => {
	return {
		type: 'http' as const,
		url: mcp_config.url,
		headers: mcp_config.headers,
		timeout: mcp_config.timeout ?? 5000
	}
}

export default async (mcp_config: McpLocalConfig | McpRemoteConfig) => {
	const transport = mcp_config.type === 'local' ? createStdioTransport(mcp_config) : createHttpTransport(mcp_config)

	return createMCPClient({ transport }) as Promise<MCPClient>
}
