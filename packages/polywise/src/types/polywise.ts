import type { Filters } from './common'
import type { LoggerConfig } from './logger'
import type { EmbeddingConfig, KeywordConfig, RerankerConfig } from './pipeline'

export interface PolywiseConfig extends Filters {
	data_dir?: string
	filters?: Filters
	pipeline?: {
		models_dir?: string
		embedding_config?: EmbeddingConfig
		reranker_config?: RerankerConfig
		keyword_config?: KeywordConfig
	}
	logger?: LoggerConfig
}

export interface QueryArgs {}
