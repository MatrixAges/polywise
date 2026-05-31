export type PromptKind = 'claude' | 'agent' | 'agent-folder'

export interface PromptMeta {
	path: string
	absolute_path: string
	kind: PromptKind
	hash: string
	summary: string
	line_count: number
}

export interface PromptMapCache {
	root: string
	prompts: Array<PromptMeta>
}
