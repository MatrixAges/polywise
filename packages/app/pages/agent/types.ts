import type { RPCOutput } from '@/types'
import type { DefaultModel } from '@core/types'
import type { ReactNode } from 'react'
import type { AvatarConfig as NiceAvatarConfig } from 'react-nice-avatar'
import type { AvatarConfig as NotionAvatarConfig } from 'react-notion-avatar'

export type AgentItem = RPCOutput['agent']['query'][number]
export type GroupItem = RPCOutput['group']['query'][number]
export type AgentSessionResponse = RPCOutput['agent']['getSessions']
export type AgentSessionItem = AgentSessionResponse['sessions'][number]
export type AgentSkillItem = RPCOutput['agent']['getSkills'][number]
export type AgentPrivateArticleResponse = RPCOutput['agent']['getPrivateArticles']
export type AgentArticleItem = AgentPrivateArticleResponse['list'][number]
export type AgentArticleSearchItem = RPCOutput['agent']['searchArticles']['list'][number]
export type AgentSkillLogResponse = RPCOutput['agent']['getSkillLogs']
export type AgentSkillLogItem = AgentSkillLogResponse['items'][number]
export type SkillItem = RPCOutput['skill']['query'][number]
export type AgentToolItem = RPCOutput['tool']['query'][number]
export type AgentToolLogResponse = RPCOutput['agent']['getToolLogs']
export type AgentToolLogItem = AgentToolLogResponse['items'][number]
export type AgentPageMode = 'sessions' | 'detail'
export type AgentMenuScope = 'agent' | 'group'
export type AgentCreateMode = 'auto' | 'input'
export type AgentTab =
	| 'sessions'
	| 'info'
	| 'prompt'
	| 'soul'
	| 'identity'
	| 'memory'
	| 'skills'
	| 'tools'
	| 'content'
	| 'graph'
export type ArticleForType = 'linkcase' | 'wiki' | 'memory' | 'user'
export type AvatarMode = 'upload' | 'nice' | 'notion'

export interface ISkillOption {
	value: string
	label: string
	description: string
	path: string
}

export interface IToolOption {
	value: string
	label: string
	description: string
}

export interface IAgentSessionMenuItemProps {
	item: AgentSessionItem
	pin: boolean
	session_index: number
	selected: boolean
	renaming: boolean
	rename_value: string
}

export interface IAgentMenuSessionItemProps {
	item: AgentSessionItem
	session_index: number
	selected: boolean
	renaming: boolean
	rename_value: string
	title?: ReactNode
	pin?: boolean
	class_name?: string
	onClick?: () => void
}

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
	key: 'name' | 'role' | 'description' | AgentTab
	value: string
}

export interface IUpdateAgentArgs {
	id: string
	name?: string
	role?: string
	description?: string
	prompt?: string
	soul?: string
	identity?: string
	memory?: string
	tools?: Array<string>
	model?: DefaultModel
	photo?: Uint8Array | null
	avatar?: AgentAvatarConfig | null
}

export interface IGroupDialogSubmitArgs {
	id?: string
	name: string
	description: string
	photo?: Uint8Array | null
	agent_ids: Array<string>
	folders: Array<{ name: string; path: string }>
}
