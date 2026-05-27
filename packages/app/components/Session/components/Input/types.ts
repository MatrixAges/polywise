export type MentionTrigger = '/' | '@'

export interface McpMentionItem {
	key: string
	type: 'mcp'
	label: string
	desc: string
	transport_type: 'local' | 'remote'
	search_text: string
}

export interface SkillMentionItem {
	key: string
	type: 'skill'
	label: string
	desc: string
	path: string
	skill_type: string
	search_text: string
}

export interface ToolMentionItem {
	key: string
	type: 'tool'
	label: string
	desc: string
	search_text: string
}

export interface FileMentionItem {
	key: string
	type: 'file'
	label: string
	path: string
	basename: string
	file_kind: 'directory' | 'file'
	search_text: string
}

export interface AgentMentionItem {
	key: string
	type: 'agent'
	label: string
	role: string
	desc: string
	photo?: Uint8Array | null
	avatar?: unknown
	search_text: string
}

export type MentionItem = SkillMentionItem | ToolMentionItem | FileMentionItem | AgentMentionItem | McpMentionItem

export interface ActiveMention {
	trigger: MentionTrigger
	query: string
	start: number
	end: number
}

export interface MentionSection<T extends MentionItem = MentionItem> {
	key: 'agents' | 'files' | 'tools' | 'mcps' | 'skills'
	items: Array<T>
}

export type SessionTokenType = 'agent' | 'skill' | 'tool' | 'file' | 'reference' | 'mcp'

export interface SessionTokenAttrs {
	tokenType: SessionTokenType
	label: string
	refStart: number | null
	refEnd: number | null
}
