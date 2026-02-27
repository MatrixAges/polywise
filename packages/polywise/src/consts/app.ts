import { homedir } from 'os'
import { resolve } from 'path'

import type { EmbeddingConfig, KeywordConfig, RerankerConfig } from '../types'

export const default_data_dir = resolve(`${homedir()}/.polywise/.memory`)
export const schema_meta = 'meta'
export const schema_brain = 'brain'
export const schema_memory = 'memory'
export const schema_user = 'user'

export const default_models_dir = resolve(`${homedir()}/.polywise/.models`)
export const default_embedding_model = 'onnx-community/Qwen3-Embedding-0.6B-ONNX'
export const default_reranker_model = 'onnx-community/bge-reranker-v2-m3-ONNX'

export const default_embedding_config = {
	type: 'local',
	model: default_embedding_model
} as EmbeddingConfig

export const default_reranker_config = {
	type: 'local',
	model: default_reranker_model
} as RerankerConfig

export const default_keyword_config = {
	type: 'local',
	model: default_embedding_model
} as KeywordConfig

export const default_logger_dir = resolve(`${homedir()}/.polywise/logger`)
export const default_date_format = 'YYYY-MM-DD'
export const default_timestamp_format = 'YYYY-MM-DD HH:mm:ss'

export const default_article_search_limit = 20
