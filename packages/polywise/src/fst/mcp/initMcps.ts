import createMcpClient from './createMcpClient'
import getEnabledMcps from './getEnabledMcps'
import loadConfig from './loadConfig'

export const mcp_client_map = new Map<string, Awaited<ReturnType<typeof createMcpClient>>>()

export default async () => {
	const mcp_config = loadConfig()
	const enabled_mcps = getEnabledMcps(mcp_config, [])

	for (const [name, item] of enabled_mcps) {
		if (!mcp_client_map.has(name)) {
			const client = await createMcpClient(item)
			mcp_client_map.set(name, client)
		}
	}

	return mcp_client_map
}
