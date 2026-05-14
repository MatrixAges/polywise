import { keyword_search_limit } from '@core/consts/search'
import { article, chunk } from '@core/db/schema'
import { getArticles, getChunks } from '@core/db/services'
import { log } from '@core/utils'
import { and, desc, inArray, like, or } from 'drizzle-orm'

import searchByKeywords from './search/searchByKeywords'

import type { ArgsSearch } from './search'

type ScopeType = 'global' | 'project' | 'agent'

interface ChunkResult {
	id: string
	content: string
	score: number
	updated_at: string | null
	scope_type: ScopeType | null
	scope_id: string | null
}

type SearchOutput = { type: 'chunk'; results: Array<ChunkResult> } | { type: 'article'; results: Array<ChunkResult> }

interface ChunkMatch {
	id: string
	article_id: string | null
	content: string | null
	keywords: string
	created_at: Date | null
}

const direct_search_limit = keyword_search_limit * 3

interface ScoredChunk {
	chunk: ChunkMatch
	article: Awaited<ReturnType<typeof getArticles>>[number]
	score: number
}

const normalizeTerms = (query: string) => {
	const raw = query.trim()

	if (!raw) return []

	const split_terms = raw
		.split(/[\s,，。！？!?:：;；、/\\|()[\]{}"'`]+/u)
		.map(term => term.trim())
		.filter(Boolean)

	return Array.from(new Set([raw, ...split_terms.filter(term => term.length >= 2)])).slice(0, 12)
}

const getScopeInfo = (scope_type: string | null, scope_id: string | null) => {
	if (scope_type === 'global' || scope_type === 'project' || scope_type === 'agent') {
		return {
			scope_type: scope_type as ScopeType,
			scope_id
		}
	}

	return {
		scope_type: null,
		scope_id
	}
}

const isAllowedScope = (
	scope_type: string | null,
	scope_id: string | null,
	target_scope_type?: 'global' | 'project' | 'agent',
	target_scope_id?: string
) => {
	if (!target_scope_type) return true
	if (scope_type === 'global') return true
	return scope_type === target_scope_type && scope_id === (target_scope_id ?? null)
}

const getRecencyScore = (created_at: Date | null) => {
	if (!created_at) return 0

	const day_ms = 24 * 60 * 60 * 1000
	const days_ago = Math.max(0, (Date.now() - created_at.getTime()) / day_ms)

	return 1 / (1 + days_ago * 0.1)
}

const getChunkScore = (item: ChunkMatch, query: string, terms: Array<string>, fts_rank?: number) => {
	const content = item.content || ''
	const haystack = `${content}\n${item.keywords}`.toLowerCase()
	const raw_query = query.trim().toLowerCase()

	let score = 0

	if (raw_query && haystack.includes(raw_query)) {
		score += 8
	}

	for (const term of terms) {
		if (haystack.includes(term.toLowerCase())) {
			score += term === raw_query ? 3 : 1.5
		}
	}

	if (typeof fts_rank === 'number') {
		score += Math.max(0, keyword_search_limit - fts_rank + 1) / keyword_search_limit
	}

	score += getRecencyScore(item.created_at)

	return score
}

const isScoredChunk = (item: ScoredChunk | null): item is ScoredChunk => item !== null

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const { query, type = 'article', for_types, scope_type, scope_id } = args
	const terms = normalizeTerms(query)

	log('SEARCH', 'fullTextSearch:start', () => `query: ${query}, type: ${type}, terms: ${terms.join(' | ')}`)

	if (terms.length === 0) {
		return {
			type,
			results: []
		}
	}

	const [fts_results, direct_matches] = await Promise.all([
		searchByKeywords(terms.join(',')),
		getChunks({
			where: or(
				...terms.flatMap(term => [like(chunk.content, `%${term}%`), like(chunk.keywords, `%${term}%`)])
			),
			orderBy: desc(chunk.created_at),
			limit: direct_search_limit
		})
	])

	const chunk_map = new Map<string, ChunkMatch>()

	for (const item of direct_matches) {
		chunk_map.set(item.id, item)
	}

	if (fts_results.length > 0) {
		const fts_chunk_ids = fts_results.map(item => item.chunk_id).filter(id => !chunk_map.has(id))

		if (fts_chunk_ids.length > 0) {
			const fts_chunks = await getChunks({
				where: inArray(chunk.id, fts_chunk_ids)
			})

			for (const item of fts_chunks) {
				chunk_map.set(item.id, item)
			}
		}
	}

	const all_chunks = Array.from(chunk_map.values())

	if (all_chunks.length === 0) {
		return {
			type,
			results: []
		}
	}

	const article_ids = Array.from(new Set(all_chunks.map(item => item.article_id).filter(Boolean))) as Array<string>

	if (article_ids.length === 0) {
		return {
			type,
			results: []
		}
	}

	const article_filters = [inArray(article.id, article_ids)]

	if (for_types?.length) {
		article_filters.push(inArray(article.for, for_types))
	}

	const articles = await getArticles({
		where: and(...article_filters)
	})

	const article_map = new Map(articles.map(item => [item.id, item]))
	const fts_rank_map = new Map(fts_results.map(item => [item.chunk_id, item.rank]))

	const scored_chunks = all_chunks
		.map(item => {
			if (!item.article_id) return null

			const parent_article = article_map.get(item.article_id)
			if (!parent_article) return null
			if (!isAllowedScope(parent_article.scope_type, parent_article.scope_id, scope_type, scope_id))
				return null

			return {
				chunk: item,
				article: parent_article,
				score: getChunkScore(item, query, terms, fts_rank_map.get(item.id))
			}
		})
		.filter(isScoredChunk)
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score

			const b_time = b.article.updated_at?.getTime() || b.chunk.created_at?.getTime() || 0
			const a_time = a.article.updated_at?.getTime() || a.chunk.created_at?.getTime() || 0

			return b_time - a_time
		})

	log('SEARCH', 'fullTextSearch:done', () => `chunk_count: ${scored_chunks.length}`)

	if (type === 'chunk') {
		return {
			type: 'chunk',
			results: scored_chunks.slice(0, keyword_search_limit).map(item => {
				const scope = getScopeInfo(item.article.scope_type, item.article.scope_id)

				return {
					id: item.chunk.id,
					content: item.chunk.content || '',
					score: item.score,
					updated_at: item.article.updated_at?.toISOString() || null,
					scope_type: scope.scope_type,
					scope_id: scope.scope_id
				}
			})
		}
	}

	const article_results = new Map<
		string,
		{
			id: string
			content: string
			score: number
			updated_at: string | null
			scope_type: 'global' | 'project' | 'agent' | null
			scope_id: string | null
		}
	>()

	for (const item of scored_chunks) {
		if (article_results.has(item.article.id)) continue

		const scope = getScopeInfo(item.article.scope_type, item.article.scope_id)

		article_results.set(item.article.id, {
			id: item.article.id,
			content: item.article.content,
			score: item.score,
			updated_at: item.article.updated_at?.toISOString() || null,
			scope_type: scope.scope_type,
			scope_id: scope.scope_id
		})
	}

	return {
		type: 'article',
		results: Array.from(article_results.values()).slice(0, keyword_search_limit)
	}
}
