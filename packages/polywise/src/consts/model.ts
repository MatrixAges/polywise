import type { DecisionConfig, EmbeddingConfig, RerankerConfig } from '../types'

export const DEFAULT_EMBEDDING_MODEL = 'onnx-community/Qwen3-Embedding-0.6B-ONNX'
export const DEFAULT_RERANKER_MODEL = 'onnx-community/bge-reranker-v2-m3-ONNX'
export const DEFAULT_DECISION_MODEL = 'onnx-community/Qwen3-0.6B-ONNX'
export const DEFAULT_DTYPE = 'q8'
export const POOLING_MEAN = 'mean'

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

export const DEFAULT_DECISION_CONFIG: DecisionConfig = {
	type: 'local',
	model: DEFAULT_DECISION_MODEL,
	dtype: DEFAULT_DTYPE
}
