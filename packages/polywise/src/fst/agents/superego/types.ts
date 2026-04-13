export type ScopeType = 'global' | 'project' | 'agent'

export interface ScopeInfo {
	scope_type: ScopeType
	scope_id: string | null
}

export interface SuperegoAction {
	type: 'memory' | 'wiki' | 'skill'
	action: 'add' | 'search' | 'update' | 'remove'
	payload: string
	id?: string
}
