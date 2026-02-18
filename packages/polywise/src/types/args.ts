import type { PGlite } from '@electric-sql/pglite'
import type Polywise from '../Polywise'
import type { ChainEmitter } from '../utils'
import type { LogArgs } from './log'
import type { Memory, Metadata } from './polywise'

export interface BrainArgs {
	poly: Polywise
	onTick?: () => void
}

export interface FiltersArgs {
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
}

export interface PolywiseArgs extends FiltersArgs {
	data_dir?: string
	cache_dir?: string
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
	embedding_concurrency?: number
	reranker_concurrency?: number
	log?: boolean | LogArgs
	onTick?: () => void
}

export interface LocalEmbeddingConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface CustomEmbeddingConfig {
	type: 'custom'
	fn: (text: string) => Promise<Array<number>>
}

export type EmbeddingConfig = LocalEmbeddingConfig | CustomEmbeddingConfig

export interface LocalRerankerConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface CustomRerankerConfig {
	type: 'custom'
	fn: (query: string, documents: Array<string>) => Promise<Array<{ index: number; score: number }>>
}

export type RerankerConfig = LocalRerankerConfig | CustomRerankerConfig

export interface PipelineArgs {
	cache_dir?: string
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
	embedding_concurrency?: number
	reranker_concurrency?: number
}

export interface AddNodeArgs extends FiltersArgs {
	label: string
	x: number
	y: number
	threshold?: number
	metadata?: Metadata
	embedding?: Array<number>
}

export interface ConnectArgs extends FiltersArgs {
	source_id: string
	target_id: string
	weight?: number
	metadata?: Metadata
}

export interface ProcessArticleArgs extends FiltersArgs {
	content: string
	metadata?: Metadata
}

export interface UpdateArticleArgs extends FiltersArgs {
	memory_id: string
	content: string
	metadata?: Metadata
}

export interface ForgetArticleArgs extends FiltersArgs {
	memory_id: string
	query?: string
}

export interface AddArticleArgs extends FiltersArgs {
	content: string
}

export interface SearchArticlesArgs extends FiltersArgs {
	query: string
	limit?: number
	threshold?: number
}

export interface ArticleArgs {
	db: PGlite
}

export interface SearchCandidate {
	id: string
	content: string
	source: 'vector' | 'fulltext'
	metadata?: Metadata
	updated_at?: string
}

export interface ArticleSearchResult {
	id: string
	content: string
	similarity?: number
	metadata?: Metadata
	updated_at?: string
}

export interface SearchResult {
	id: string
	content: string
	source: 'vector' | 'fulltext'
	rerankScore: number
	metadata?: Metadata
	updated_at?: string
}

export interface RecallArgs extends FiltersArgs {
	query: string
	max_nodes?: number
	max_depth?: number
	stimulate_intensity?: number
	query_embedding?: Array<number>
}

export interface QueryArgs extends FiltersArgs {
	query: string
	recall_depth?: number
	search_limit?: number
	rerank_limit?: number
	cot_depth?: number
	stimulate_on_recall?: boolean
	process?: import('../Process').default
	threshold?: number
}

export interface AggregateResultsArgs {
	recall_result: any
	search_results: Array<SearchResult>
}

export interface PipelineSearchArgs {
	query: string
	rerank_limit?: number
	vectorSearch: () => Promise<Array<ArticleSearchResult>>
	fulltextSearch: () => Promise<Array<ArticleSearchResult>>
}

export interface SingleSearchArgs extends FiltersArgs {
	query: string
	recall_depth: number
	search_limit: number
	rerank_limit: number
	stimulate_on_recall: boolean
	process?: import('../Process').default
	threshold?: number
}

export interface ExecuteCotArgs extends FiltersArgs {
	query: string
	current_depth: number
	max_depth: number
	base_recall_depth: number
	search_limit: number
	rerank_limit: number
	stimulate_on_recall: boolean
	initial_memory: Array<Memory>
	emitter: ChainEmitter
	history_ids: Set<string>
}

export interface RecallNodesByKeywordsArgs extends FiltersArgs {
	keywords: Array<string>
	limit?: number
}

export interface StrengthenRelatedEdgesArgs {
	matched_nodes: Array<any>
	related_nodes: Array<any>
}
