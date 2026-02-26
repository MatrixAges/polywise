import type { Filters, Metadata } from './common'

export interface ArticleEntity extends Filters {
	id: string
	content: string
	metadata?: Metadata
	created_at: string
	updated_at?: string
}

export interface ArticleWithSimilarity extends ArticleEntity {
	similarity: number
}

export interface upsertArticleArgs extends Filters {
	content: string
	id?: string
	metadata?: Metadata
}

export interface getArticleArgs extends Filters {
	id: string
}

export interface getManyArticleArgs extends Filters {
	ids: Array<string>
}

export interface removeArticleArgs extends Filters {
	id: string
}

export interface SearchArticlesArgs extends Filters {
	text: string
	limit?: number
	threshold?: number
}
