import { homedir } from 'os'
import { resolve } from 'path'

import type { EmbeddingConfig, KeywordConfig, RerankerConfig } from '../types'

export const db = {
	default_data_dir: resolve(`${homedir()}/.polywise/.memory`),
	schema_meta: 'meta',
	schema_brain: 'brain',
	schema_memory: 'memory',
	schema_user: 'user'
} as const

export const model = {
	default_models_dir: resolve(`${homedir()}/.polywise/.models`),
	default_embedding_model: 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
	default_reranker_model: 'onnx-community/bge-reranker-v2-m3-ONNX'
}

export const default_embedding_config = { type: 'local', model: model.default_embedding_model } as EmbeddingConfig
export const default_reranker_config = { type: 'local', model: model.default_reranker_model } as RerankerConfig
export const default_keyword_config = { type: 'local', model: model.default_embedding_model } as KeywordConfig

export const loggger = {
	default_logger_dir: resolve(`${homedir()}/.polywise/logger`),
	default_date_format: 'YYYY-MM-DD',
	default_timestamp_format: 'YYYY-MM-DD HH:mm:ss'
}

export const article = {
	default_search_limit: 20
}
