import type Pipeline from '@/Pipeline'
import type { PGlite } from '@electric-sql/pglite'

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
	links?: Array<string>
	files?: Array<string>
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
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Metadata
	embedding?: Array<number>
	is_action?: boolean
	created_at?: string
	updated_at?: string
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
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Metadata
	is_habit?: boolean
	reaction_count?: number
	created_at?: string
	updated_at?: string
}

export interface ReactResult {
	action: string
	description: string
	metadata: Metadata
	confidence: number
	source: 'react' | 'act'
}

export interface Snapshot {
	nodes: Array<Node>
	edges: Array<Edge>
}

export type BrainState = 'FRESH' | 'LEARNING' | 'TIRED' | 'SLEEPING'

export interface DatabaseConfig {
	data_dir?: string
}

export type QueryResult<T = any> = Array<T>

export type MigrationFn = (
	exec: (sql: string | Array<string>) => Promise<void>,
	query: <T = any>(sql: string, params?: Array<any>) => Promise<Array<T>>
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
	embedding: Array<number>
	model_name: string
	created_at: string
}

export interface ArticleWithTriples extends ArticleEntity {
	triples: Array<Triple>
}

export type RerankerPipeline = (
	query: string,
	documents: Array<string>
) => Promise<Array<{ index: number; score: number }>>

export interface ContextResult {
	idol_id?: string
	root_ids?: Array<string>
	relevance_score: number
	article_ids: Array<number>
}

export interface Knowledge {
	id: number
	content: string
	source: 'memory' | 'external' | 'implicit' | 'long_term' | 'diary' | 'rules'
	rerankScore: number
	relevanceScore: number
	combinedScore: number
	stimulated: boolean
	memoryStrength: number
	metadata?: any
}

export interface Action {
	id: number
	content: string
	source: 'memory' | 'external' | 'implicit' | 'long_term' | 'diary' | 'rules'
	rerankScore: number
	relevanceScore: number
	combinedScore: number
	stimulated: boolean
	memoryStrength: number
	metadata?: any
}

export interface MemoryResult {
	id: number
	content: string
	similarity: number
	source: 'long_term' | 'diary'
	timestamp?: string
	last_accessed_at?: string
}

export interface COTDepthResult {
	knowledges: Array<string>
	actions: Array<string>
	metadata: Metadata
}

export interface FinalQueryResult {
	knowledges: Array<string>
	actions: Array<string>
	metadata: Metadata
	cot: any
}

export interface MemoryRecallResult {
	nodes: Array<Node>
	edges: Array<Edge>
	stimulated_nodes: Array<number>
	related_contexts: Array<ContextResult>
}
