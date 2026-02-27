import type { ChainEmitter, Process } from '../utils'
import type { Edge, Node } from './brain'
import type { Metadata, Scopes } from './common'
import type { LoggerConfig } from './logger'
import type { EmbeddingConfig, KeywordConfig, RerankerConfig } from './pipeline'

export interface PolywiseConfig {
	data_dir?: string
	scopes?: Scopes
	pipeline?: {
		models_dir?: string
		embedding_config?: EmbeddingConfig
		reranker_config?: RerankerConfig
		keyword_config?: KeywordConfig
	}
	logger?: LoggerConfig
}

export interface QueryArgs {
	query: string
	cot_depth?: number
	process?: Process
}

export interface CotResult {
	memory: Array<MemoryResult>
}

export interface QueryResult {
	memory: Array<MemoryResult>
	cot?: ChainEmitter
}

export interface RecallResult {
	nodes: Array<Node>
	edges: Array<Edge>
	stimulated_nodes: Array<string>
	related_contexts: Array<ContextResult>
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
	context_id?: string
}

export interface MemoryResult {
	memory_id: string
	text: string
	score: number
	updated_at: string
	metadata?: Metadata
}

export interface ContextResult {
	relevance_score: number
	article_ids: Array<string>
}
