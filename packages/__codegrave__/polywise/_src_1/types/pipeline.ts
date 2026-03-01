import type { RequiredDeep } from 'type-fest'
import type { Metadata } from './common'
import type { PolywiseConfig } from './polywise'

export type PipelineConfig = PolywiseConfig['pipeline']
export type RequiredPipelineConfig = RequiredDeep<PolywiseConfig>['pipeline']

export interface LocalModelConfig {
	type: 'local'
	model: string
}

export interface CustomEmbeddingConfig {
	type: 'custom'
	fn: (text: string) => Promise<Array<number>>
}

export interface CustomRerankerConfig {
	type: 'custom'
	fn: (query: string, documents: Array<string>) => Promise<Array<{ score: number }>>
}

export interface CustomKeywordConfig {
	type: 'custom'
	fn: (text: string) => Promise<Array<string>>
}

export type EmbeddingConfig = LocalModelConfig | CustomEmbeddingConfig
export type RerankerConfig = LocalModelConfig | CustomRerankerConfig
export type KeywordConfig = LocalModelConfig | CustomKeywordConfig

export interface SearchCandidate {
	id: string
	content: string
	source: 'vector' | 'fulltext'
	metadata?: Metadata
	updated_at?: string
	context_id?: string | null
}
