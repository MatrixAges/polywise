import type { McpConfig, McpLocalConfig, McpRemoteConfig } from '@core/types'

export type McpServerConfig = McpLocalConfig | McpRemoteConfig | { enabled: boolean }

export type { McpConfig, McpLocalConfig, McpRemoteConfig }
