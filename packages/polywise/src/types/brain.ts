export type BrainState = 'FRESH' | 'LEARNING' | 'TIRED' | 'SLEEPING'

export interface Node {
	id: string
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
