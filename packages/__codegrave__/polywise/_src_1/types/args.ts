import { Metadata } from './common'

export interface SearchResult {
	id: string
	content: string
	source: 'vector' | 'fulltext'
	score: number
	metadata?: Metadata
	updated_at?: string
	context_id?: string | null
}
