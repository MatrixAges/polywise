export interface RecallArgs {
	query: string
	query_embedding?: Array<number>
	max_nodes?: number
	max_depth?: number
	stimulate_intensity?: number
	is_learning?: boolean
	arousal?: number
	context_id?: string
}
