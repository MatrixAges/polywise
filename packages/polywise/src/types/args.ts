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
}

export interface LocalEmbeddingConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface APIEmbeddingConfig {
	type: 'api'
	api_url: string
	api_key?: string
	model?: string
}

export interface CustomEmbeddingConfig {
	type: 'custom'
	fn: (text: string) => Promise<number[]>
}

export type EmbeddingConfig = LocalEmbeddingConfig | APIEmbeddingConfig | CustomEmbeddingConfig

export interface LocalRerankerConfig {
	type: 'local'
	model: string
	dtype?: string
}

export interface APIRerankerConfig {
	type: 'api'
	api_url: string
	api_key?: string
	model?: string
}

export interface CustomRerankerConfig {
	type: 'custom'
	fn: (query: string, documents: string[]) => Promise<{ index: number; score: number }[]>
}

export type RerankerConfig = LocalRerankerConfig | APIRerankerConfig | CustomRerankerConfig

export interface PipelineArgs {
	cache_dir?: string
	embedding_config?: EmbeddingConfig
	reranker_config?: RerankerConfig
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
