import type { PGlite } from '@electric-sql/pglite'
import type Polywise from '../Polywise'
import type { Metadata, Triple } from './polywise'

export interface BrainArgs {
	poly: Polywise
	onTick?: () => void
}

export interface PolywiseArgs {
	data_dir?: string
	embedding_cache_dir?: string
	onTick?: () => void
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
}

export interface LocalEmbeddingConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface CustomEmbeddingConfig {
	type: 'custom'
	fn: (text: string) => Promise<number[]>
}

export type EmbeddingConfig = LocalEmbeddingConfig | CustomEmbeddingConfig

export interface LocalRerankerConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface CustomRerankerConfig {
	type: 'custom'
	fn: (query: string, documents: string[]) => Promise<{ index: number; score: number }[]>
}

export type RerankerConfig = LocalRerankerConfig | CustomRerankerConfig

export interface PipelineArgs {
	cache_dir?: string
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
	embedding_concurrency?: number
	reranker_concurrency?: number
}

export interface AddNodeArgs {
	label: string
	x: number
	y: number
	threshold?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: Metadata
}

export interface ConnectArgs {
	source_id: number
	target_id: number
	weight?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: Metadata
}

export interface ProcessArticleArgs {
	title: string
	content: string
	triples: Triple[]
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	generate_embedding?: boolean
}

export interface InjectTriplesArgs {
	triples: Triple[]
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface UpsertNodeArgs {
	label: string
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: Metadata
}

export interface AddArticleArgs {
	title: string
	content: string
}

export interface SearchArticleArgs {
	query: string
	limit?: number
}

export interface ArticleArgs {
	db: PGlite
}

export interface SearchCandidate {
	id: number
	content: string
	title: string
	source: 'vector' | 'fulltext'
}

export interface ArticleSearchResult {
	id: number
	title: string
	content: string
	similarity?: number
}

export interface SearchResult {
	id: number
	title: string
	content: string
	source: 'vector' | 'fulltext'
	rerankScore: number
}

export interface RecallArgs {
	query: string
	query_embedding?: number[]
	max_nodes?: number
	max_depth?: number
	stimulate_intensity?: number
	recall_idol_id?: string
	recall_root_ids?: string[]
}

export interface QueryArgs {
	query: string
	recall_depth?: number
	search_limit?: number
	rerank_limit?: number
	stimulate_on_recall?: boolean
	cot_depth?: number
}

export interface AggregatedCandidate {
	id: number
	title: string
	content: string
	source: 'memory' | 'external' | 'implicit'
	rerankScore: number
	relevance_score: number
	stimulated: boolean
	memory_strength: number
}

export interface HybridSearchResult {
	id: number
	title: string
	content: string
	source: 'memory' | 'external' | 'implicit'
	rerankScore: number
	relevanceScore: number
	combinedScore: number
	stimulated: boolean
	memoryStrength: number
}

export interface COTDepthResult {
	depth: number
	query: string
	results: HybridSearchResult[]
	emerged_nodes: number[]
	emerged_edges: number[]
}

export interface ChainOfThought {
	on: (callback: (data: COTDepthResult) => void) => ChainOfThought
	off: () => void
}
