export interface SessionState {
	context: Record<string, unknown>
	history: Array<unknown>
	undo_stack: Array<Record<string, unknown>>
	redo_stack: Array<Record<string, unknown>>
}
