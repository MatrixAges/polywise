import type { Action, Knowledge } from './polywise'

export interface Step {
	id: number
	thought: string
	query: string
	result_summary: string
}

export interface WorkingMemory {
	original_goal: string
	steps: Array<Step>
	accumulated_knowledges: Array<Knowledge>
	accumulated_actions: Array<Action>
	context_embedding: Array<number>
	history_ids: Set<number>
}

export interface CortexProcessArgs {
	query: string
	recall_depth?: number
	search_limit?: number
	rerank_limit?: number
	cot_depth?: number
	stimulate_on_recall?: boolean
	habit_threshold?: number
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	process?: import('../Process').default
}
