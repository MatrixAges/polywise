import type Process from '../Process'

export interface CortexProcessArgs {
	query: string
	recall_depth?: number
	search_limit?: number
	rerank_limit?: number
	cot_depth?: number
	stimulate_on_recall?: boolean
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	process?: Process
}
