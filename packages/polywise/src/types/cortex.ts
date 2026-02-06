import type { Action, Knowledge } from './polywise'

export interface Step {
	id: number
	thought: string
	query: string
	result_summary: string
}

export interface WorkingMemory {
	original_goal: string
	steps: Step[]
	accumulated_knowledges: Knowledge[]
	accumulated_actions: Action[]
	context_embedding: number[]
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
	root_ids?: string[]
	metrics_ids?: string[]
}
