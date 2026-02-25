import type { PGlite } from '@electric-sql/pglite'
import type ChainEmitter from '../utils/ChainEmitter'

export interface Metadata {
	desc?: string
	links?: Array<string>
	files?: Array<string>
}

export interface Node {
	id: string
	label: string
	x: number
	y: number
	potential: number
	threshold: number
	current_threshold?: number
	is_active: boolean
	last_fired_at?: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	article_ids?: Array<string>
	embedding?: Array<number>
	created_at?: string
	updated_at?: string
	lock?: boolean
}

export interface Edge {
	id?: string
	source_id: string
	target_id: string
	weight: number
	distance: number
	learning_rate: number
	decay_resistance: number
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	reaction_count?: number
	created_at?: string
	updated_at?: string
	lock?: boolean
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
	query?: <T = any>(sql: string, params?: Array<any>) => Promise<Array<T>>
) => Promise<void>

export interface Migration {
	version: number
	description: string
	up: MigrationFn
}

export interface ArticleEntity {
	id: string
	content: string
	created_at: string
	updated_at?: string
	metadata?: Metadata
}

export interface ArticleWithSimilarity extends ArticleEntity {
	similarity: number
}

export interface ArticleEmbedding {
	id: string
	article_id: string
	embedding: Array<number>
	model_name: string
	created_at: string
}

export interface ArticleWithKeywords extends ArticleEntity {
	keywords: Array<string>
}

export type RerankerPipeline = (
	query: string,
	documents: Array<string>
) => Promise<Array<{ index: number; score: number }>>

export interface ContextResult {
	idol_id?: string
	root_ids?: Array<string>
	relevance_score: number
	article_ids: Array<string>
}

export interface Memory {
	id: string
	content: string
	source: 'memory' | 'external' | 'implicit'
	score: number
	stimulated: boolean
	memoryStrength: number
	metadata: Metadata
	updated_at?: string
}

export interface COTDepthResult {
	memory: Array<{
		memory_id: string
		text: string
		score: number
		metadata: Metadata | null
		updated_at: string
	}>
}

export interface FinalQueryResult {
	memory: Array<{
		memory_id: string
		text: string
		score: number
		metadata: Metadata | null
		updated_at: string
	}>
	cot: ChainEmitter | null
}

export interface RecallResult {
	nodes: Array<Node>
	edges: Array<Edge>
	stimulated_nodes: Array<string>
	related_contexts: Array<ContextResult>
}
