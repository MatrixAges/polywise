import type { EmbeddingConfig, RerankerConfig } from './types'

export const DEFAULT_EMBEDDING_MODEL = 'onnx-community/Qwen3-Embedding-0.6B-ONNX'
export const DEFAULT_RERANKER_MODEL = 'onnx-community/Qwen3-Reranker-0.6B-ONNX'
export const DEFAULT_DTYPE = 'q8'

export const DEFAULT_API_EMBEDDING_MODEL = 'text-embedding-3-small'
export const DEFAULT_API_RERANKER_MODEL = 'rerank-english-v2.0'

export const EMBEDDING_TYPE_LOCAL = 'local'
export const EMBEDDING_TYPE_API = 'api'

export const POOLING_MEAN = 'mean'

export const HTTP_HEADERS = {
	CONTENT_TYPE: 'Content-Type',
	AUTHORIZATION: 'Authorization',
	CONTENT_TYPE_JSON: 'application/json'
}

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
	type: 'local',
	model: DEFAULT_EMBEDDING_MODEL,
	dtype: DEFAULT_DTYPE
}

export const DEFAULT_RERANKER_CONFIG: RerankerConfig = {
	type: 'local',
	model: DEFAULT_RERANKER_MODEL,
	dtype: DEFAULT_DTYPE
}
