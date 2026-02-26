import type { Scopes } from './common'
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

export interface QueryArgs {}
