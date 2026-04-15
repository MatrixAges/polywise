export type ScopeType = 'global' | 'project' | 'agent'

export interface SuperegoAction {
	type: 'memory' | 'wiki' | 'skill'
	action: 'add' | 'search' | 'update' | 'remove'
	payload: string
	id?: string
}

export interface SuperegoEvent {
	result: string
	timestamp: number
}
