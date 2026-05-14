import { article, link, link_article } from '@core/db/schema'
import { getArticle, getLink, getLinks, setLink } from '@core/db/services'
import { addLinkArticle, getLinkArticles } from '@core/db/services/externals'
import { fetchWithFallbackChain, fetchWithProvider } from '@core/fetch'
import { saveArticle } from '@core/io'
import { eq, inArray, like, or } from 'drizzle-orm'

import type { Link } from '@core/db'
import type { WebfetchFallbackProvider } from '@core/types'
import type { SQL } from 'drizzle-orm'

export const DEFAULT_LINKCASE_FETCH_MAX_CHARS = 50000
export const linkcase_filter_types = ['title', 'link'] as const
export const linkcase_statuses = ['none', 'pending', 'success', 'fail', 'timeout', 'ignore'] as const

export type LinkcaseFilterType = (typeof linkcase_filter_types)[number]
export type LinkcaseStatus = (typeof linkcase_statuses)[number]
type LinkArticleRow = Awaited<ReturnType<typeof getLinkArticles>>[number]
type LinkcasePreviewArticle = {
	id: string
	title: string | null
	created_at: Date | null
	updated_at: Date | null
	is_pipelined: boolean
	fetched_at: Date | null
}

type LinkcaseFetchPreviewCacheItem = {
	id: string
	url: string
	title: string
	source: WebfetchFallbackProvider
	content: string
	truncated: boolean
	created_at: number
}

const linkcase_fetch_preview_cache = new Map<string, LinkcaseFetchPreviewCacheItem>()
const LINKCASE_FETCH_PREVIEW_TTL_MS = 10 * 60 * 1000

const cleanupLinkcaseFetchPreviewCache = () => {
	const cutoff = Date.now() - LINKCASE_FETCH_PREVIEW_TTL_MS

	for (const [key, item] of linkcase_fetch_preview_cache.entries()) {
		if (item.created_at < cutoff) {
			linkcase_fetch_preview_cache.delete(key)
		}
	}
}

const normalizeKeyword = (keyword?: string) => keyword?.trim() ?? ''

const serializeArticlePreview = (item?: LinkArticleRow): LinkcasePreviewArticle | null => {
	if (!item) {
		return null
	}

	return {
		id: item.article.id,
		title: item.article.title,
		created_at: item.article.created_at,
		updated_at: item.article.updated_at,
		is_pipelined: item.article.is_pipelined,
		fetched_at: item.link_article.created_at
	}
}

export const getLinkcaseWhere = (args: { keyword?: string; filter_type?: LinkcaseFilterType }) => {
	const keyword = normalizeKeyword(args.keyword)

	if (!keyword) {
		return undefined
	}

	if (args.filter_type === 'link') {
		return like(link.url, `%${keyword}%`) as SQL
	}

	return like(link.title, `%${keyword}%`) as SQL
}

export const hydrateLinkcaseItems = async (items: Array<Link>) => {
	const link_ids = items.map(item => item.id)
	const article_rows =
		link_ids.length > 0
			? await getLinkArticles({
					where: inArray(link_article.link_id, link_ids)
				})
			: []

	const article_map = article_rows.reduce(
		(total, item) => {
			if (!total[item.link_article.link_id]) {
				total[item.link_article.link_id] = []
			}

			total[item.link_article.link_id].push(item)

			return total
		},
		{} as Record<string, Array<LinkArticleRow>>
	)

	return items.map(item => {
		const related_articles = article_map[item.id] ?? []

		return {
			...item,
			article_count: related_articles.length,
			article: serializeArticlePreview(related_articles[0])
		}
	})
}

export const getLinkcaseItem = async (id: string) => {
	const item = await getLink(eq(link.id, id))

	if (!item) {
		return null
	}

	const [result] = await hydrateLinkcaseItems([item])

	return result ?? null
}

export const getLinkcaseReadItem = async (id: string) => {
	const item = await getLinkcaseItem(id)

	if (!item) {
		return null
	}

	if (!item.article?.id) {
		return {
			...item,
			article: null
		}
	}

	const current_article = await getArticle(eq(article.id, item.article.id))

	return {
		...item,
		article: current_article
			? {
					...item.article,
					content: current_article.content
				}
			: null
	}
}

const isTimeoutError = (message?: string) => {
	return typeof message === 'string' && /timeout|timed out|aborted|abort/i.test(message)
}

const saveLinkcaseArticle = async (args: { id: string; title: string; content: string; exec_pipeline?: boolean }) => {
	const article_id = await saveArticle({
		title: args.title,
		content: args.content,
		for: 'linkcase',
		exec_pipeline: args.exec_pipeline
	})

	await addLinkArticle(args.id, article_id)

	const article_item = await getArticle(eq(article.id, article_id))
	const updated_link = await setLink(eq(link.id, args.id), {
		status: 'success',
		generate_at: new Date()
	})

	return {
		article: article_item ?? null,
		link: updated_link
	}
}

export const previewLinkcaseLinkWithProvider = async (args: {
	id: string
	provider: WebfetchFallbackProvider
	max_chars?: number
}) => {
	const current_link = await getLink(eq(link.id, args.id))

	if (!current_link) {
		throw new Error(`Link not found: ${args.id}`)
	}

	cleanupLinkcaseFetchPreviewCache()

	const max_chars = args.max_chars ?? DEFAULT_LINKCASE_FETCH_MAX_CHARS
	const result = await fetchWithProvider(args.provider, current_link.url, max_chars)
	const preview_key = crypto.randomUUID()

	linkcase_fetch_preview_cache.set(preview_key, {
		id: current_link.id,
		url: current_link.url,
		title: current_link.title || current_link.url,
		source: args.provider,
		content: result.content,
		truncated: result.truncated,
		created_at: Date.now()
	})

	return {
		ok: true as const,
		id: current_link.id,
		title: current_link.title,
		url: current_link.url,
		source: args.provider,
		truncated: result.truncated,
		content_preview: result.content.slice(0, 4000),
		content_length: result.content.length,
		preview_key
	}
}

export const commitLinkcasePreview = async (args: { preview_key: string; exec_pipeline?: boolean }) => {
	cleanupLinkcaseFetchPreviewCache()

	const cached = linkcase_fetch_preview_cache.get(args.preview_key)

	if (!cached) {
		throw new Error(`Preview not found or expired: ${args.preview_key}`)
	}

	const current_link = await getLink(eq(link.id, cached.id))

	if (!current_link) {
		linkcase_fetch_preview_cache.delete(args.preview_key)
		throw new Error(`Link not found: ${cached.id}`)
	}

	const saved = await saveLinkcaseArticle({
		id: current_link.id,
		title: current_link.title,
		content: cached.content,
		exec_pipeline: args.exec_pipeline
	})

	linkcase_fetch_preview_cache.delete(args.preview_key)

	return {
		ok: true as const,
		id: current_link.id,
		title: current_link.title,
		url: current_link.url,
		source: cached.source,
		truncated: cached.truncated,
		article: saved.article,
		link: saved.link ?? current_link
	}
}

export const markLinkcaseFetchFailure = async (args: { id: string; error: string }) => {
	const current_link = await getLink(eq(link.id, args.id))

	if (!current_link) {
		throw new Error(`Link not found: ${args.id}`)
	}

	const status = isTimeoutError(args.error) ? 'timeout' : 'fail'
	const updated_link = await setLink(eq(link.id, args.id), { status })

	return {
		ok: false as const,
		id: current_link.id,
		title: current_link.title,
		url: current_link.url,
		status,
		error: args.error,
		link: updated_link ?? current_link
	}
}

export const fetchLinkcaseLink = async (args: { id: string; exec_pipeline?: boolean; max_chars?: number }) => {
	const current_link = await getLink(eq(link.id, args.id))

	if (!current_link) {
		throw new Error(`Link not found: ${args.id}`)
	}

	await setLink(eq(link.id, args.id), {
		status: 'pending'
	})

	const max_chars = args.max_chars ?? DEFAULT_LINKCASE_FETCH_MAX_CHARS
	const result = await fetchWithFallbackChain(current_link.url, max_chars)

	if (!result.ok) {
		const status =
			isTimeoutError(result.error) || result.attempts.some(item => isTimeoutError(item.error))
				? 'timeout'
				: 'fail'
		const updated_link = await setLink(eq(link.id, args.id), { status })

		return {
			ok: false as const,
			link: updated_link ?? current_link,
			article: null,
			source: result.source,
			error: result.error,
			attempts: result.attempts
		}
	}

	try {
		const saved = await saveLinkcaseArticle({
			id: current_link.id,
			title: current_link.title,
			content: result.content,
			exec_pipeline: args.exec_pipeline
		})

		return {
			ok: true as const,
			link: saved.link ?? current_link,
			article: saved.article,
			source: result.source,
			truncated: result.truncated,
			attempts: result.attempts
		}
	} catch (error) {
		await setLink(eq(link.id, args.id), {
			status: 'fail'
		})

		throw error
	}
}

export const getLinkcaseKeywordWhere = (keyword?: string, match_title = true, match_url = true) => {
	const normalized_keyword = normalizeKeyword(keyword)

	if (!normalized_keyword) {
		return undefined
	}

	const where_list = [] as Array<SQL>

	if (match_title) {
		where_list.push(like(link.title, `%${normalized_keyword}%`))
	}

	if (match_url) {
		where_list.push(like(link.url, `%${normalized_keyword}%`))
	}

	if (where_list.length === 0) {
		return undefined
	}

	if (where_list.length === 1) {
		return where_list[0]
	}

	return or(...where_list)
}

export const listLinkcaseItems = async (args: { where?: SQL; limit?: number; offset?: number }) => {
	const items = await getLinks({
		where: args.where,
		limit: args.limit,
		offset: args.offset
	})

	return hydrateLinkcaseItems(items)
}
