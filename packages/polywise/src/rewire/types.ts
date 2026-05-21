export type RewireEdgeState = 'active' | 'silent'

export interface RewireConfig {
	enabled: boolean
	tick_ms: number
	monitor_ms: number
	idle_grace_ms: number
	replay_window_ms: number
	max_groups_per_cycle: number
	max_edge_creations_per_cycle: number
	max_edge_prunes_per_cycle: number
	hot_node_degree_limit: number
	cold_node_degree_limit: number
}

export interface RewireRuntimeStatus {
	running: boolean
	last_cycle_at: number | null
	last_status: 'idle' | 'running' | 'success' | 'error'
	last_error: string | null
	last_summary: RewireCycleSummary | null
	last_foreground_at: number
	last_visit_at: number
}

export interface RewireCycleSummary {
	cycle_at: number
	skipped: boolean
	reason?: string
	groups_processed: number
	events_deleted: number
	edges_created: number
	edges_strengthened: number
	edges_promoted: number
	edges_pruned: number
	edges_downgraded: number
	edges_decayed: number
	touched_nodes: number
}

export interface RewireRuntime {
	timer: NodeJS.Timeout | null
	cycle_timer: NodeJS.Timeout | null
	status: RewireRuntimeStatus
	start: () => Promise<void>
	stop: () => Promise<void>
	runOnce: () => Promise<RewireCycleSummary>
	touchForeground: () => void
	touchVisit: () => void
}

export interface RewireEventInput {
	agent_id?: string | null
	session_id?: string | null
	stimulus_key: string
	signal: string
	events: Array<{
		node_id: string
		role: 'center' | 'accepted' | 'rejected' | 'neighbor'
		strength?: number
	}>
}

export interface ReplayGroup {
	stimulus_key: string
	signal: string
	event_ids: Array<string>
	center_node_ids: Array<string>
	accepted_node_ids: Array<string>
	rejected_node_ids: Array<string>
	total_strength: number
	last_event_at: number
}
