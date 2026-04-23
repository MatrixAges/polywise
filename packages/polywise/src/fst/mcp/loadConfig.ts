import { config } from '@core/config'

import type { McpConfig } from './types'

export default () => {
	return (config.mcp ?? { enabled: true }) as McpConfig
}
