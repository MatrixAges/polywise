export type BrainState = 'FRESH' | 'LEARNING' | 'TIRED' | 'SLEEPING'

export interface Node {
	id: string
	context_id: string | null
	label: string | null
	x: number | null
	y: number | null
	potential: number
	threshold: number
	current_threshold: number
	transmitter: number
	is_active: boolean
	last_fired_at: string | null
	article_ids: Array<string>
	embedding: Array<number> | null
	created_at: string
	updated_at: string
	lock: boolean
}

export interface Edge {
	id: string
	context_id: string | null
	source_id: string | null
	target_id: string | null
	weight: number
	distance: number
	learning_rate: number
	decay_resistance: number
	reaction_count: number
	created_at: string
	updated_at: string
	lock: boolean
}

export interface SequenceScore {
	context_id: string
	score: number
}

export interface SequenceFrontierItem {
	context_id: string
	base_score: number
	path_ids: Set<string>
}

export interface TickOptions {
	threshold?: number
	is_learning?: boolean
	arousal?: number
}

export interface SpreadOptions {
	steps?: number
	threshold?: number
	is_learning?: boolean
	arousal?: number
}

export interface SleepReplayPayload {
	context_ids: Array<string>
	context_scores: Array<number>
}
