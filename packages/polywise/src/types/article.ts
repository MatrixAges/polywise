import type { Metadata } from './common'

export interface ArticleEntity {
	id: string
	content: string
	metadata?: Metadata
	created_at: string
	updated_at?: string
}

export interface ArticleWithSimilarity extends ArticleEntity {
	similarity: number
}

export interface upsertArticleArgs {
	content: string
	id?: string
	metadata?: Metadata
}

export interface SearchArticlesArgs {
	text: string
	limit?: number
	threshold?: number
}
