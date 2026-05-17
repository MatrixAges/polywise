import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { article, chunk, edge, link, link_article, node } from '@core/db/schema'
import {
	addEdge,
	addNode,
	getArticle,
	getChunks,
	getEdge,
	getLink,
	getLinks,
	getNode,
	setLink
} from '@core/db/services'
import { addLinkArticle, addNodeChunk, getLinkArticles } from '@core/db/services/externals'
import { fetchWithFallbackChain, fetchWithProvider } from '@core/fetch'
import { saveArticle } from '@core/io'
import { getEmbedding, getTriples } from '@core/pipeline'
import { and, asc, eq, inArray, isNull, like, or } from 'drizzle-orm'

import type { Link } from '@core/db'
import type { WebfetchFallbackProvider } from '@core/types'
import type { SQL } from 'drizzle-orm'

export const DEFAULT_LINKCASE_FETCH_MAX_CHARS = 50000
export const linkcase_filter_types = ['title', 'link'] as const
export const linkcase_statuses = ['none', 'pending', 'success', 'fail', 'timeout', 'ignore'] as const

export type LinkcaseFilterType = (typeof linkcase_filter_types)[number]
export type LinkcaseStatus = (typeof linkcase_statuses)[number]
type LinkArticleRow = Awaited<ReturnType<typeof getLinkArticles>>[number]
type LinkcaseExtractResult = {
	id: string
	title: string
	url: string
	article_id: string
	triple_count: number
	chunk_count: number
	reused_article: boolean
}
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
const LINKCASE_PIPELINE_WAIT_MS = 15_000
const LINKCASE_PIPELINE_POLL_MS = 250
const LINKCASE_FAVICON_TIMEOUT_MS = 10_000
const LINKCASE_FAVICON_MAX_BYTES = 512 * 1024
const LINKCASE_FAVICON_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'

const cleanupLinkcaseFetchPreviewCache = () => {
	const cutoff = Date.now() - LINKCASE_FETCH_PREVIEW_TTL_MS

	for (const [key, item] of linkcase_fetch_preview_cache.entries()) {
		if (item.created_at < cutoff) {
			linkcase_fetch_preview_cache.delete(key)
		}
	}
}

const normalizeKeyword = (keyword?: string) => keyword?.trim() ?? ''
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const normalizeTripleText = (value: string) => value.replace(/\s+/g, ' ').trim()

const parseHtmlAttribute = (tag: string, name: string) => {
	const matched = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))

	if (!matched) {
		return ''
	}

	return (matched[2] ?? matched[3] ?? matched[4] ?? '').trim()
}

const looksLikeHtmlDocument = (value: Uint8Array) => {
	const head = new TextDecoder().decode(value.slice(0, 512)).trim().toLowerCase()

	return head.startsWith('<!doctype html') || head.startsWith('<html') || head.startsWith('<head')
}

const isLikelyFaviconResponse = (content_type: string, bytes: Uint8Array) => {
	const normalized_type = content_type.toLowerCase()

	if (
		normalized_type.includes('image/') ||
		normalized_type.includes('svg+xml') ||
		normalized_type.includes('x-icon') ||
		normalized_type.includes('vnd.microsoft.icon')
	) {
		return true
	}

	return !looksLikeHtmlDocument(bytes)
}

const listFaviconCandidates = (source_url: string, html: string) => {
	const matches = html.match(/<link\b[^>]*>/gi) ?? []
	const seen = new Set<string>()
	const results = [] as Array<string>

	for (const tag of matches) {
		const rel = parseHtmlAttribute(tag, 'rel').toLowerCase()
		const href = parseHtmlAttribute(tag, 'href')

		if (!href || !rel.includes('icon')) {
			continue
		}

		try {
			const resolved = new URL(href, source_url).toString()

			if (seen.has(resolved)) {
				continue
			}

			seen.add(resolved)
			results.push(resolved)
		} catch {
			continue
		}
	}

	try {
		const fallback = new URL('/favicon.ico', source_url).toString()

		if (!seen.has(fallback)) {
			seen.add(fallback)
			results.push(fallback)
		}
	} catch {
		return results
	}

	return results
}

const fetchFaviconBytes = async (favicon_url: string) => {
	const response = await fetch(favicon_url, {
		signal: AbortSignal.timeout(LINKCASE_FAVICON_TIMEOUT_MS),
		headers: {
			'User-Agent': LINKCASE_FAVICON_USER_AGENT,
			Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
		}
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}

	const bytes = new Uint8Array(await response.arrayBuffer())

	if (bytes.length === 0 || bytes.length > LINKCASE_FAVICON_MAX_BYTES) {
		throw new Error(`Unexpected favicon size: ${bytes.length}`)
	}

	if (!isLikelyFaviconResponse(response.headers.get('content-type') ?? '', bytes)) {
		throw new Error('Response is not a favicon image')
	}

	return bytes
}

const resolveLinkcaseFavicon = async (source_url: string) => {
	const candidates = [] as Array<string>

	try {
		const response = await fetch(source_url, {
			signal: AbortSignal.timeout(LINKCASE_FAVICON_TIMEOUT_MS),
			headers: {
				'User-Agent': LINKCASE_FAVICON_USER_AGENT,
				Accept: 'text/html,application/xhtml+xml,*/*'
			}
		})

		if (response.ok) {
			const content_type = (response.headers.get('content-type') ?? '').toLowerCase()

			if (content_type.includes('html') || content_type.includes('xml') || !content_type) {
				const html = await response.text()

				candidates.push(...listFaviconCandidates(source_url, html))
			}
		}
	} catch {
		// Best effort only. Fall back to /favicon.ico below.
	}

	if (candidates.length === 0) {
		try {
			candidates.push(new URL('/favicon.ico', source_url).toString())
		} catch {
			return null
		}
	}

	for (const candidate of candidates) {
		try {
			return await fetchFaviconBytes(candidate)
		} catch {
			continue
		}
	}

	return null
}

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
	const current_link = await getLink(eq(link.id, args.id))
	const favicon = current_link ? await resolveLinkcaseFavicon(current_link.url).catch(() => null) : null
	const updated_link = await setLink(eq(link.id, args.id), {
		status: 'success',
		generate_at: new Date(),
		...(favicon ? { favicon } : {})
	})

	return {
		article: article_item ?? null,
		link: updated_link
	}
}

const waitForArticlePipeline = async (article_id: string) => {
	const deadline = Date.now() + LINKCASE_PIPELINE_WAIT_MS

	while (Date.now() < deadline) {
		const current_article = await getArticle(eq(article.id, article_id))
		const current_chunks = await getChunks({
			where: eq(chunk.article_id, article_id),
			orderBy: asc(chunk.position)
		})

		if (current_article?.is_pipelined && current_chunks.length > 0) {
			return current_chunks
		}

		await sleep(LINKCASE_PIPELINE_POLL_MS)
	}

	throw new Error(`Timed out while waiting for article pipeline: ${article_id}`)
}

const ensureGlobalNode = async (name: string) => {
	const normalized_name = normalizeTripleText(name)

	if (!normalized_name) {
		return null
	}

	const existing = await getNode(and(isNull(node.agent_id), eq(node.name, normalized_name)))

	if (existing) {
		return existing
	}

	const inserted = await addNode({
		agent_id: null,
		name: normalized_name
	})
	const embedding = await getEmbedding(normalized_name)
	const row = getNodeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		insertNodeVector().run(BigInt(row.rowid), Buffer.from(new Float32Array(embedding).buffer))
	}

	return inserted
}

const ensureGlobalEdge = async (source_id: string, target_id: string, relation: string) => {
	const normalized_relation = normalizeTripleText(relation)

	if (!normalized_relation) {
		return null
	}

	const existing = await getEdge(and(eq(edge.source_id, source_id), eq(edge.target_id, target_id)))

	if (existing) {
		return existing
	}

	return addEdge({
		agent_id: null,
		source_id,
		target_id,
		relation: normalized_relation
	})
}

const findRelatedChunks = (content_chunks: Awaited<ReturnType<typeof getChunks>>, entity_names: Array<string>) => {
	const normalized_entities = entity_names
		.map(item => item.toLowerCase())
		.filter(Boolean)
		.filter((item, index, list) => list.indexOf(item) === index)

	if (normalized_entities.length === 0) {
		return content_chunks.slice(0, 1)
	}

	const matched_chunks = content_chunks.filter(chunk_item => {
		const text = chunk_item.content?.toLowerCase() ?? ''

		return normalized_entities.some(entity => text.includes(entity))
	})

	return matched_chunks.length > 0 ? matched_chunks : content_chunks.slice(0, 1)
}

const linkNodesToChunks = async (
	node_ids: Array<string>,
	content_chunks: Awaited<ReturnType<typeof getChunks>>,
	entity_names: Array<string>
) => {
	if (node_ids.length === 0 || content_chunks.length === 0) {
		return
	}

	const target_chunks = findRelatedChunks(content_chunks, entity_names)
	const seen_pairs = new Set<string>()

	for (const node_id of node_ids) {
		for (const chunk_item of target_chunks) {
			const pair_key = `${node_id}:${chunk_item.id}`

			if (seen_pairs.has(pair_key)) {
				continue
			}

			seen_pairs.add(pair_key)
			await addNodeChunk(node_id, chunk_item.id).catch(() => null)
		}
	}
}

export const extractLinkcaseArticle = async (args: { id: string; force?: boolean }): Promise<LinkcaseExtractResult> => {
	const item = await getLinkcaseReadItem(args.id)

	if (!item) {
		throw new Error(`Link not found: ${args.id}`)
	}

	const article_item = item.article
	const content = article_item?.content?.trim()

	if (!content) {
		throw new Error(`No fetched content available for ${item.title || item.url}`)
	}

	if (article_item?.is_pipelined && !args.force) {
		const content_chunks = await getChunks({
			where: eq(chunk.article_id, article_item.id),
			orderBy: asc(chunk.position)
		})

		return {
			id: item.id,
			title: item.title,
			url: item.url,
			article_id: article_item.id,
			triple_count: 0,
			chunk_count: content_chunks.length,
			reused_article: true
		}
	}

	const article_id = await saveArticle({
		article_id: article_item?.id,
		title: article_item?.title || item.title,
		content,
		for: 'linkcase',
		exec_pipeline: true
	})
	const content_chunks = await waitForArticlePipeline(article_id)
	const triples = await getTriples(content)
	const node_id_map = new Map<string, string>()

	for (const triple of triples) {
		const head_name = normalizeTripleText(triple.head)
		const tail_name = normalizeTripleText(triple.tail)
		const relation = normalizeTripleText(triple.relation)

		if (!head_name || !tail_name || !relation) {
			continue
		}

		const [head_node, tail_node] = await Promise.all([ensureGlobalNode(head_name), ensureGlobalNode(tail_name)])

		if (!head_node || !tail_node) {
			continue
		}

		node_id_map.set(head_name, head_node.id)
		node_id_map.set(tail_name, tail_node.id)

		await ensureGlobalEdge(head_node.id, tail_node.id, relation)
		await linkNodesToChunks([head_node.id, tail_node.id], content_chunks, [head_name, tail_name])
	}

	return {
		id: item.id,
		title: item.title,
		url: item.url,
		article_id,
		triple_count: triples.length,
		chunk_count: content_chunks.length,
		reused_article: Boolean(article_item?.id)
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

const listBatchFetchCandidates = async (count: number) => {
	return hydrateLinkcaseItems(
		await getLinks({
			where: inArray(link.status, ['none', 'fail', 'timeout']),
			limit: Math.max(count * 4, 20)
		})
	).then(items => items.slice(0, count))
}

const listBatchExtractCandidates = async (count: number) => {
	const items = await hydrateLinkcaseItems(
		await getLinks({
			where: eq(link.status, 'success'),
			limit: Math.max(count * 6, 30)
		})
	)

	return items.filter(item => item.article?.id && !item.article.is_pipelined).slice(0, count)
}

export const runLinkcaseBatch = async (args: { count: number; run_fetch: boolean; run_extract: boolean }) => {
	if (!args.run_fetch && !args.run_extract) {
		throw new Error('Select at least one batch action.')
	}

	const fetched = [] as Array<{
		id: string
		title: string
		url: string
		ok: boolean
		status: string
		article_id: string | null
		error: string | null
	}>
	const extracted = [] as Array<LinkcaseExtractResult>

	if (args.run_fetch) {
		const targets = await listBatchFetchCandidates(args.count)

		for (const item of targets) {
			try {
				const result = await fetchLinkcaseLink({ id: item.id })

				fetched.push({
					id: item.id,
					title: item.title,
					url: item.url,
					ok: result.ok,
					status: result.link.status,
					article_id: result.article?.id ?? null,
					error: result.ok ? null : (result.error ?? 'Unknown fetch error')
				})
			} catch (error) {
				fetched.push({
					id: item.id,
					title: item.title,
					url: item.url,
					ok: false,
					status: 'fail',
					article_id: null,
					error: error instanceof Error ? error.message : String(error)
				})
			}
		}
	}

	if (args.run_extract) {
		const extract_target_ids = new Set<string>()

		for (const item of fetched) {
			if (item.ok && item.id) {
				extract_target_ids.add(item.id)
			}
		}

		if (extract_target_ids.size < args.count) {
			const fallback_targets = await listBatchExtractCandidates(args.count)

			for (const item of fallback_targets) {
				if (extract_target_ids.size >= args.count) {
					break
				}

				extract_target_ids.add(item.id)
			}
		}

		for (const id of extract_target_ids) {
			extracted.push(await extractLinkcaseArticle({ id, force: false }))
		}
	}

	return {
		ok: true as const,
		fetch_count: fetched.length,
		extract_count: extracted.length,
		fetched,
		extracted
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
