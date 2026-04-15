export type ScopeType = 'global' | 'project' | 'agent'

export interface SuperegoAction {
	type: 'memory' | 'wiki' | 'skill'
	action: 'add' | 'search' | 'update' | 'remove'
	payload: string
	id?: string
}

export interface SuperegoEvent {
	type: 'extracted' | 'skipped' | 'error'
	actions: Array<{ tool: string; action: string; summary: string }>
	timestamp: number
}
