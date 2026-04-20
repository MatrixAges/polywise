export type ScopeType = 'global' | 'project' | 'agent'

export type SuperegoToolName = 'memory_tool' | 'wiki_tool' | 'skill_tool'

export type SuperegoToolAction = 'add' | 'search' | 'update' | 'remove' | 'read' | 'create' | 'build'

export interface SuperegoAction {
	tool: SuperegoToolName
	action: SuperegoToolAction
	target: string
}

export interface SuperegoResult {
	summary: string
	actions: Array<SuperegoAction>
}

export interface SuperegoEvent {
	result: string
	timestamp: number
}
