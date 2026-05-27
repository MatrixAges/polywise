import { getMcpClient, mcp_client_map } from './client'
import getEnabledMcps from './getEnabledMcps'
import loadConfig from './loadConfig'

export default async () => {
	const mcp_config = loadConfig()
	const enabled_mcps = getEnabledMcps(mcp_config, [])

	for (const [name, item] of enabled_mcps) {
		await getMcpClient(name, item)
	}

	return mcp_client_map
}
