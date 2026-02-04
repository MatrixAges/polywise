export interface Triple {
	subject: string
	predicate: string
	object: string
	learning_rate: number
	decay_resistance: number
	metadata?: Metadata
}

export interface Metadata {
	desc?: string
	links?: string[]
	files?: string[]
}

export interface Node {
	id: number
	label: string
	x: number
	y: number
	potential: number
	activation: number
	threshold: number
	last_fired_at?: string
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: Metadata
	embedding?: number[]
	is_action?: boolean
}

export interface Edge {
	source_id: number
	target_id: number
	weight: number
	distance: number
	type?: string
	learning_rate: number
	decay_resistance: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: Metadata
	is_habit?: boolean
	reaction_count?: number
}

export interface ReactResult {
	action: string
	description: string
	metadata: Metadata
	confidence: number
	source: 'react' | 'act'
}

export interface Snapshot {
	nodes: Node[]
	edges: Edge[]
}

export type BrainState = 'FRESH' | 'LEARNING' | 'TIRED' | 'SLEEPING'

export interface DatabaseConfig {
	data_dir?: string
}

export type QueryResult<T = any> = T[]

export type MigrationFn = (
	exec: (sql: string | string[]) => Promise<void>,
	query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
) => Promise<void>

export interface Migration {
	version: number
	description: string
	up: MigrationFn
}

export interface ArticleEntity {
	id: number
	content: string
	created_at: string
}

export interface ArticleWithSimilarity extends ArticleEntity {
	similarity: number
}

export interface ArticleEmbedding {
	id: number
	article_id: number
	embedding: number[]
	model_name: string
	created_at: string
}

export interface ArticleWithTriples extends ArticleEntity {
	triples: Triple[]
}

export type RerankerPipeline = (query: string, documents: string[]) => Promise<{ index: number; score: number }[]>

export interface ContextResult {
	idol_id?: string
	root_ids?: string[]
	relevance_score: number
	article_ids: number[]
}

export interface Knowledge {
	id: number
	content: string
	source: 'memory' | 'external' | 'implicit'
	rerankScore: number
	relevanceScore: number
	combinedScore: number
	stimulated: boolean
	memoryStrength: number
	metadata?: Metadata
}

export interface Action {
	id: number
	content: string
	source: 'memory' | 'external' | 'implicit'
	rerankScore: number
	relevanceScore: number
	combinedScore: number
	stimulated: boolean
	memoryStrength: number
	metadata?: Metadata
}

export interface COTDepthResult {
	depth: number
	query: string
	knowledges: string[]
	actions: string[]
	metadata: Metadata
}

export interface FinalQueryResult {
	knowledges: string[]
	actions: string[]
	metadata: Metadata
	cot: any
}

export interface MemoryRecallResult {
	nodes: Node[]
	edges: Edge[]
	stimulated_nodes: number[]
	related_contexts: ContextResult[]
}
