import type { PGlite } from '@electric-sql/pglite'
import type Polywise from '../Polywise'
import type { ChainEmitter } from '../utils'
import type { Action, Knowledge, MemoryRecallResult, Metadata, Triple } from './polywise'

export interface BrainArgs {
	poly: Polywise
	onTick?: () => void
}

export interface LogArgs {
	dir: string
	log?: boolean
	json?: boolean
}

export interface FiltersArgs {
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface PolywiseArgs extends FiltersArgs {
	data_dir?: string
	cache_dir?: string
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
	embedding_concurrency?: number
	reranker_concurrency?: number
	onTick?: () => void
	log?: boolean | LogArgs
}

export interface ReactArgs {
	habit_threshold?: number
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

export interface AddNodeArgs extends FiltersArgs {
	label: string
	x: number
	y: number
	threshold?: number
	metadata?: Metadata
	embedding?: number[]
	is_action?: boolean
}

export interface ConnectArgs extends FiltersArgs {
	source_id: number
	target_id: number
	weight?: number
	metadata?: Metadata
	is_habit?: boolean
}

export interface ProcessArticleArgs extends FiltersArgs {
	content: string
	article_id?: number
}

export interface InjectTriplesArgs extends FiltersArgs {
	article_id: number
	triples: Triple[]
}

export interface UpsertNodeArgs extends FiltersArgs {
	label: string
	article_id: number
	metadata?: Metadata
	embedding?: number[]
	is_action?: boolean
}

export interface AddArticleArgs {
	content: string
}

export interface ArticleArgs {
	db: PGlite
}

export interface SearchCandidate {
	id: number
	content: string
	source: 'vector' | 'fulltext'
}

export interface ArticleSearchResult {
	id: number
	content: string
	similarity?: number
}

export interface SearchResult {
	id: number
	content: string
	source: 'vector' | 'fulltext'
	rerankScore: number
}

export interface RecallArgs extends FiltersArgs {
	query: string
	max_nodes?: number
	max_depth?: number
	stimulate_intensity?: number
	query_embedding?: number[]
}

export interface QueryArgs extends FiltersArgs {
	query: string
	recall_depth?: number
	search_limit?: number
	rerank_limit?: number
	cot_depth?: number
	stimulate_on_recall?: boolean
	habit_threshold?: number
}

export interface AggregateResultsArgs {
	recall_result: MemoryRecallResult
	search_results: SearchResult[]
	habits?: any[]
}

// Optimized parameter interface definition, ensuring variables come before functions
export interface PipelineSearchArgs {
	query: string
	rerank_limit?: number
	vector_search: () => Promise<ArticleSearchResult[]>
	fulltext_search: () => Promise<ArticleSearchResult[]>
}

export interface SingleSearchArgs extends FiltersArgs {
	query: string
	recall_depth: number
	search_limit: number
	rerank_limit: number
	stimulate_on_recall: boolean
}

export interface ExecuteCotArgs extends FiltersArgs {
	query: string
	current_depth: number
	max_depth: number
	base_recall_depth: number
	search_limit: number
	rerank_limit: number
	stimulate_on_recall: boolean
	initial_knowledges: Knowledge[]
	initial_actions: Action[]
	emitter: ChainEmitter
	history_ids: Set<number>
}

export interface RecallNodesByKeywordsArgs extends FiltersArgs {
	keywords: string[]
	limit?: number
}

export interface HabituateArgs {
	stimulus: string
	action_label: string
	weight?: number
	metadata?: Metadata
}

export interface StrengthenRelatedEdgesArgs {
	matched_nodes: any[]
	related_nodes: any[]
}
