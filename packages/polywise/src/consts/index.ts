import type { EmbeddingConfig, RerankerConfig } from './types'

export const DEFAULT_EMBEDDING_MODEL = 'onnx-community/Qwen3-Embedding-0.6B-ONNX'
export const DEFAULT_RERANKER_MODEL = 'onnx-community/bge-reranker-v2-m3-ONNX'
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

export const DEFAULT_CONCURRENCY = 6
export const SHADOW_INTERVAL_MS = 60 * 1000
export const FATIGUE_THRESHOLD = 1000
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000

export const formatNodeContent = (label: string, desc?: string) => {
	return desc || `Concept: ${label}`
}

export const formatSourceInfo = (source: string, stimulated: boolean, memoryStrength: number) => {
	return `[Source:${source}${stimulated ? ',Activated' : ''},Memory Strength:${memoryStrength.toFixed(2)}]`
}

export const PERCEIVE_COMMAND = 'perceive'

export const SCHEMA_META = 'meta'
export const SCHEMA_BRAIN = 'brain'
export const SCHEMA_KNOWLEDGE = 'knowledge'
export const SCHEMA_USER = 'user'

export const formatPerceiveQuery = (query: string, insights: string) => {
	return `${query} [${PERCEIVE_COMMAND}: ${insights}]`
}
