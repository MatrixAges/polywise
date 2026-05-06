import type { RPCOutput } from '@/types'
import type { DefaultModel } from '@core/types'
import type { AvatarConfig as NiceAvatarConfig } from 'react-nice-avatar'
import type { AvatarConfig as NotionAvatarConfig } from 'react-notion-avatar'

export type AgentItem = RPCOutput['agent']['query'][number]
export type AgentSessionResponse = RPCOutput['agent']['getSessions']
export type AgentSessionItem = AgentSessionResponse['sessions'][number]
export type AgentTab = 'sessions' | 'prompt' | 'soul' | 'identity' | 'memory'
export type AvatarMode = 'upload' | 'nice' | 'notion'

export interface IAgentAvatarNice {
	type: 'nice'
	data: NiceAvatarConfig
}

export interface IAgentAvatarNotion {
	type: 'notion'
	data: NotionAvatarConfig
}

export type AgentAvatarConfig = IAgentAvatarNice | IAgentAvatarNotion

export interface IEditableFieldArgs {
	id: string
	key: 'name' | 'description' | AgentTab
	value: string
}

export interface IUpdateAgentArgs {
	id: string
	name?: string
	description?: string
	prompt?: string
	soul?: string
	identity?: string
	memory?: string
	model?: DefaultModel
	photo?: Uint8Array | null
	avatar?: AgentAvatarConfig | null
}
