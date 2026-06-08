import { global_linkcase_session_id } from '@core/consts'
import {
	deleteEdgeFts,
	deleteNodeFts,
	getEdgeRowid,
	getNodeRowid,
	insertEdgeFts,
	insertNodeFts
} from '@core/db/prepare'
import { article, chunk, edge, link, link_article, node } from '@core/db/schema'
import {
	addEdge,
	addLink,
	addNode,
	getArticle,
	getChunks,
	getEdge,
	getLink,
	getLinkHash,
	getLinks,
	getNode,
	normalizeLinkUrl,
	removeLink,
	setArticle,
	setLink
} from '@core/db/services'
import { addEdgeArticle, addLinkArticle, addNodeChunk, getLinkArticles } from '@core/db/services/externals'
import { fetchWithFallbackChain, fetchWithProvider } from '@core/fetch'
import { remove as removeArticle, saveArticle } from '@core/io'
import {
	assertPipelineTaskNotCancelled,
	getPipelineTask,
	isPipelineTaskCancelledError,
	patchPipelineTask,
	readPipelineStore,
	removePipelineTask
} from '@core/io/save/pipelineStore'
import {
	getArticleMetadataObject,
	getUpdatedAtToken,
	isArticleChunkPipelineReady,
	isArticleGraphBackfillDoneCurrent
} from '@core/io/save/saveArticle'
import { getTriples } from '@core/pipeline'
import { log, SessionStore } from '@core/utils'
import { and, asc, eq, inArray, isNull, like, or } from 'drizzle-orm'
import fastq from 'fastq'

import { getLinkFavicon } from './getLinkFavicon'

import type { Link } from '@core/db'
import type { WebfetchFallbackProvider } from '@core/types'
import type { SQL } from 'drizzle-orm'

export const DEFAULT_LINKCASE_FETCH_MAX_CHARS = 200_000
export const LINKCASE_FETCH_PREVIEW_PAGE_SIZE = 30_000
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
	is_pipelined: boolean
	queued: boolean
}
type LinkcasePreviewArticle = {
	id: string
	title: string | null
	metadata: unknown
	created_at: Date | null
	updated_at: Date | null
	is_pipelined: boolean
	fetched_at: Date | null
}
type LinkcaseRemoveResult = {
	link: Link
	removed_article_ids: Array<string>
}

type LinkcaseFetchPreviewCacheItem = {
	id: string
	url: string
	title: string
	fetched_title: string | null
	source: WebfetchFallbackProvider
	content: string
	truncated: boolean
	created_at: number
}
type LinkcaseRunningTask =
	| {
			kind: 'session'
			started_at: number
	  }
	| {
			kind: 'batch'
			action: string
			started_at: number
	  }

const linkcase_fetch_preview_cache = new Map<string, LinkcaseFetchPreviewCacheItem>()
const linkcase_extract_running_tasks = new Map<string, Promise<void>>()
const linkcase_batch_running_state = {
	action: '',
	started_at: 0
}
const LINKCASE_FETCH_PREVIEW_TTL_MS = 10 * 60 * 1000
const LINKCASE_FETCH_PREVIEW_MIN_PAGE_SIZE = 1_000
const LINKCASE_PIPELINE_WAIT_MS = 90_000
const LINKCASE_PIPELINE_POLL_MS = 250
const LINKCASE_TASK_BUSY_ERROR_PREFIX = 'Linkcase task is already running'
const LINKCASE_EXTRACT_FASTQ_MAX_CONCURRENCY = 10
const linkcase_markdown_label_url_regexp = /\[((?:https?:\/\/)[^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const linkcase_markdown_href_url_regexp = /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g
const linkcase_visible_url_regexp = /(?<!\]\()https?:\/\/[^\s)<>\]]+/g

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
const prepareLinkcaseArticleContent = (content: string) => content.replace(/\r\n?/g, '\n').trim()
const isAbsoluteLinkcaseAssetUrl = (value: string) =>
	/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//') || value.startsWith('#')

const resolveLinkcaseAssetUrl = (value: string, base_url: string) => {
	if (!value || isAbsoluteLinkcaseAssetUrl(value)) {
		return value
	}

	try {
		return new URL(value, base_url).toString()
	} catch {
		return value
	}
}

const normalizeLinkcaseImageSources = (args: { content: string; base_url: string }) =>
	args.content
		.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (_matched, alt, src, suffix) => {
			const resolved_src = resolveLinkcaseAssetUrl(src, args.base_url)

			return `![${alt}](${resolved_src}${suffix})`
		})
		.replace(/<img\b([^>]*?)\ssrc=(["'])([^"']+)\2([^>]*)>/gi, (_matched, before, quote, src, after) => {
			const resolved_src = resolveLinkcaseAssetUrl(src, args.base_url)

			return `<img${before} src=${quote}${resolved_src}${quote}${after}>`
		})

const normalizeLinkcaseComparableText = (content: string) =>
	content
		.replace(/\r\n?/g, '\n')
		.replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 $2')
		.replace(/^[>\-+*#\d.\s|]+/gm, '')
		.replace(/[`*_~]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()

const collectLinkcaseComparableBlocks = (content: string) => {
	const paragraph_blocks = content
		.split(/\n{2,}/)
		.map(normalizeLinkcaseComparableText)
		.filter(block => block.length >= 24)

	if (paragraph_blocks.length > 0) {
		return paragraph_blocks
	}

	return content
		.split('\n')
		.map(normalizeLinkcaseComparableText)
		.filter(block => block.length >= 24)
}

const getLinkcaseComparableOverlap = (args: { cleaned_content: string; preview_content: string }) => {
	const comparable_blocks = collectLinkcaseComparableBlocks(args.cleaned_content)

	if (comparable_blocks.length === 0) {
		return {
			comparable_block_count: 0,
			matched_block_count: 0,
			total_length: 0,
			matched_length: 0
		}
	}

	const normalized_preview = normalizeLinkcaseComparableText(args.preview_content)

	return comparable_blocks.reduce(
		(total, block) => {
			total.total_length += block.length

			if (normalized_preview.includes(block)) {
				total.matched_block_count += 1
				total.matched_length += block.length
			}

			return total
		},
		{
			comparable_block_count: comparable_blocks.length,
			matched_block_count: 0,
			total_length: 0,
			matched_length: 0
		}
	)
}

const assertLinkcaseCommittedContentPreservesOriginalText = (args: { content: string; preview_content: string }) => {
	const normalized_content = prepareLinkcaseArticleContent(args.content)
	const overlap = getLinkcaseComparableOverlap({
		cleaned_content: normalized_content,
		preview_content: args.preview_content
	})

	if (overlap.comparable_block_count === 0 || overlap.total_length === 0) {
		return normalized_content
	}

	const matched_block_ratio = overlap.matched_block_count / overlap.comparable_block_count
	const matched_length_ratio = overlap.matched_length / overlap.total_length

	if (matched_block_ratio < 0.6 || matched_length_ratio < 0.75) {
		throw new Error(
			'Committed Linkcase content must preserve the original article wording. Remove noise only and keep the remaining body text verbatim.'
		)
	}

	return normalized_content
}

const normalizeLinkcaseVisibleUrl = (value: string) => {
	const trimmed_value = value
		.trim()
		.replace(/…+$/u, '')
		.replace(/\.{3,}$/g, '')
		.replace(/[)\],;!?]+$/g, '')
		.replace(/[。．，、；：！？）】》〉」』]+$/u, '')

	try {
		return normalizeLinkUrl(trimmed_value)
	} catch {
		return null
	}
}

const collectRegexpUrls = (args: { content: string; regexp: RegExp; index: number }) => {
	const matched_urls = [] as Array<string>

	args.regexp.lastIndex = 0

	for (const matched of args.content.matchAll(args.regexp)) {
		const url = matched[args.index]

		if (!url) {
			continue
		}

		const normalized_url = normalizeLinkcaseVisibleUrl(url)

		if (!normalized_url) {
			continue
		}

		matched_urls.push(normalized_url)
	}

	return matched_urls
}

const dedupeUrls = (values: Array<string>) => Array.from(new Set(values))

const collectLinkcasePreviewKeyUrls = (content: string) =>
	dedupeUrls([
		...collectRegexpUrls({
			content,
			regexp: linkcase_markdown_label_url_regexp,
			index: 1
		}),
		...collectRegexpUrls({
			content,
			regexp: linkcase_visible_url_regexp,
			index: 0
		})
	])

const collectLinkcaseSavedUrls = (content: string) =>
	dedupeUrls([
		...collectRegexpUrls({
			content,
			regexp: linkcase_markdown_label_url_regexp,
			index: 1
		}),
		...collectRegexpUrls({
			content,
			regexp: linkcase_markdown_href_url_regexp,
			index: 1
		}),
		...collectRegexpUrls({
			content,
			regexp: linkcase_visible_url_regexp,
			index: 0
		})
	])

const preserveLinkcasePreviewKeyUrls = (args: { content: string; preview_content: string }) => {
	const normalized_content = prepareLinkcaseArticleContent(args.content)
	const preview_urls = collectLinkcasePreviewKeyUrls(args.preview_content)

	if (preview_urls.length === 0) {
		return normalized_content
	}

	const saved_url_set = new Set(collectLinkcaseSavedUrls(normalized_content))
	const missing_urls = preview_urls.filter(url => !saved_url_set.has(url))

	if (missing_urls.length === 0) {
		return normalized_content
	}

	const suffix = missing_urls.map(url => `- ${url}`).join('\n')

	return normalized_content ? `${normalized_content}\n\n${suffix}` : suffix
}

const hasLinkcaseFavicon = (favicon: unknown) => favicon instanceof Uint8Array && favicon.length > 0

const refreshLinkcaseFaviconInBackground = (link_id: string) => {
	void queueMicrotask(async () => {
		try {
			const current_link = await getLink(eq(link.id, link_id))

			if (!current_link || hasLinkcaseFavicon(current_link.favicon)) {
				return
			}

			const favicon = await getLinkFavicon(current_link.url).catch(() => null)

			if (!hasLinkcaseFavicon(favicon)) {
				return
			}

			await setLink(eq(link.id, link_id), {
				favicon
			})
		} catch (error) {
			log('SAVE', 'linkcaseFaviconRefreshError', () =>
				error instanceof Error ? error.message : String(error)
			)
		}
	})
}

const getRunningLinkcaseTask = (): LinkcaseRunningTask | null => {
	const linkcase_session = SessionStore.get(global_linkcase_session_id)

	if (linkcase_session?.running_since) {
		return {
			kind: 'session',
			started_at: linkcase_session.running_since.getTime()
		}
	}

	if (linkcase_batch_running_state.action) {
		return {
			kind: 'batch',
			action: linkcase_batch_running_state.action,
			started_at: linkcase_batch_running_state.started_at
		}
	}

	return null
}

const getLinkcaseTaskBusyError = (task: LinkcaseRunningTask) => {
	if (task.kind === 'session') {
		return `${LINKCASE_TASK_BUSY_ERROR_PREFIX}: batch session`
	}

	return `${LINKCASE_TASK_BUSY_ERROR_PREFIX}: scheduled ${task.action}`
}

const withLinkcaseBatchRunLock = async <T>(action: string, fn: () => Promise<T>) => {
	const running_task = getRunningLinkcaseTask()

	if (running_task) {
		throw new Error(getLinkcaseTaskBusyError(running_task))
	}

	linkcase_batch_running_state.action = action
	linkcase_batch_running_state.started_at = Date.now()

	try {
		return await fn()
	} finally {
		linkcase_batch_running_state.action = ''
		linkcase_batch_running_state.started_at = 0
	}
}

const getPreviewPage = (content: string, page: number, page_size = LINKCASE_FETCH_PREVIEW_PAGE_SIZE) => {
	const safe_page = Math.max(1, page)
	const safe_page_size = Math.min(
		LINKCASE_FETCH_PREVIEW_PAGE_SIZE,
		Math.max(LINKCASE_FETCH_PREVIEW_MIN_PAGE_SIZE, page_size)
	)
	const content_length = content.length
	const page_count = Math.max(1, Math.ceil(content_length / safe_page_size))
	const normalized_page = Math.min(safe_page, page_count)
	const start = (normalized_page - 1) * safe_page_size
	const end = Math.min(start + safe_page_size, content_length)

	return {
		page: normalized_page,
		page_size: safe_page_size,
		page_count,
		content_preview: content.slice(start, end),
		content_preview_start: start,
		content_preview_end: end,
		has_prev_page: normalized_page > 1,
		has_next_page: normalized_page < page_count
	}
}

const serializeArticlePreview = (item?: LinkArticleRow): LinkcasePreviewArticle | null => {
	if (!item) {
		return null
	}

	return {
		id: item.article.id,
		title: item.article.title,
		metadata: item.article.metadata,
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

export const removeLinkcaseItem = async (id: string): Promise<LinkcaseRemoveResult | null> => {
	const current_link = await getLink(eq(link.id, id))

	if (!current_link) {
		return null
	}

	const related_articles = await getLinkArticles({
		where: eq(link_article.link_id, id)
	})

	await removeLink(eq(link.id, id))

	const removed_article_ids = [] as Array<string>

	for (const item of related_articles) {
		const remain = await getLinkArticles({
			where: eq(link_article.article_id, item.article.id),
			limit: 1
		})

		if (remain.length > 0) {
			continue
		}

		await removeArticle(item.article.id)
		removed_article_ids.push(item.article.id)
	}

	return {
		link: current_link,
		removed_article_ids
	}
}

export const createLinkcaseItem = async (args: { url: string; title?: string; content?: string }) => {
	const url = args.url.trim()
	const title = args.title?.trim() || url
	const content = args.content?.trim() || ''
	const favicon = await getLinkFavicon(url).catch(() => null)

	const created_link = await addLink({
		url,
		title,
		...(favicon ? { favicon } : {})
	})

	if (!created_link) {
		throw new Error(`Failed to create link: ${url}`)
	}

	await setLink(eq(link.id, created_link.id), {
		title,
		...(favicon ? { favicon } : {}),
		...(content
			? {
					status: 'success' as const,
					generate_at: new Date()
				}
			: {})
	})

	if (content) {
		const article_id = await saveArticle({
			title,
			content,
			for: 'linkcase',
			exec_pipeline: false
		})

		await addLinkArticle(created_link.id, article_id)
	}

	return getLinkcaseReadItem(created_link.id)
}

export const updateLinkcaseItem = async (args: { id: string; url: string; title?: string; content?: string }) => {
	const current_link = await getLink(eq(link.id, args.id))

	if (!current_link) {
		throw new Error(`Link not found: ${args.id}`)
	}

	const url = normalizeLinkUrl(args.url)
	const title = args.title?.trim() || url
	const content = args.content?.trim() || ''
	const hash = getLinkHash(url)
	const conflict = (await getLink(eq(link.hash, hash))) ?? (await getLink(eq(link.url, url))) ?? null

	if (conflict && conflict.id !== args.id) {
		throw new Error('A link with the same URL already exists.')
	}

	const related_articles = await getLinkArticles({
		where: eq(link_article.link_id, args.id),
		limit: 1
	})
	const current_article = related_articles[0]?.article ?? null
	const favicon = await getLinkFavicon(url).catch(() => current_link.favicon ?? null)

	await setLink(eq(link.id, args.id), {
		url,
		hash,
		title,
		favicon,
		status: content ? 'success' : current_article ? 'none' : current_link.status,
		generate_at: content ? new Date() : current_article ? null : current_link.generate_at
	})

	if (current_article) {
		await saveArticle({
			article_id: current_article.id,
			title,
			content,
			for: 'linkcase',
			exec_pipeline: false
		})
	} else if (content) {
		const article_id = await saveArticle({
			title,
			content,
			for: 'linkcase',
			exec_pipeline: false
		})

		await addLinkArticle(args.id, article_id)
	}

	return getLinkcaseReadItem(args.id)
}

const isTimeoutError = (message?: string) => {
	return typeof message === 'string' && /timeout|timed out|aborted|abort/i.test(message)
}

const saveLinkcaseArticle = async (args: {
	id: string
	url: string
	title: string
	fetched_title?: string | null
	content: string
	exec_pipeline?: boolean
}) => {
	const current_title = args.title.trim()
	const fetched_title = args.fetched_title?.trim() || ''
	const final_title = current_title || fetched_title || args.url
	const normalized_content = normalizeLinkcaseImageSources({
		content: prepareLinkcaseArticleContent(args.content),
		base_url: args.url
	})
	const article_id = await saveArticle({
		title: final_title,
		content: normalized_content,
		for: 'linkcase',
		exec_pipeline: args.exec_pipeline
	})

	await addLinkArticle(args.id, article_id)

	const article_item = await getArticle(eq(article.id, article_id))
	const current_link = await getLink(eq(link.id, args.id))
	const updated_link = await setLink(eq(link.id, args.id), {
		...(!current_title && fetched_title ? { title: fetched_title } : {}),
		status: 'success',
		generate_at: new Date()
	})

	if (current_link && !hasLinkcaseFavicon(current_link.favicon)) {
		refreshLinkcaseFaviconInBackground(current_link.id)
	}

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
		const pipeline_task = (await readPipelineStore())[article_id]

		if (pipeline_task?.status === 'error') {
			throw new Error(pipeline_task.error_message || `Article pipeline failed: ${article_id}`)
		}

		if (current_article?.is_pipelined || (current_article && isArticleChunkPipelineReady(current_article))) {
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
	const row = getNodeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		deleteNodeFts().run(BigInt(row.rowid))
		insertNodeFts().run(BigInt(row.rowid), normalized_name)
	}

	return inserted
}

const ensureGlobalEdge = async (args: {
	source_id: string
	target_id: string
	source_name: string
	target_name: string
	relation: string
}) => {
	const { source_id, target_id, source_name, target_name, relation } = args
	const normalized_relation = normalizeTripleText(relation)

	if (!normalized_relation) {
		return null
	}

	const existing = await getEdge(and(eq(edge.source_id, source_id), eq(edge.target_id, target_id)))

	if (existing) {
		return existing
	}

	const inserted = await addEdge({
		agent_id: null,
		source_id,
		target_id,
		relation: normalized_relation
	})
	const row = getEdgeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		deleteEdgeFts().run(BigInt(row.rowid))
		insertEdgeFts().run(BigInt(row.rowid), `${source_name} ${normalized_relation} ${target_name}`.trim())
	}

	return inserted
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

const runLinkcaseExtractTask = (args: { id: string; article_id: string; content: string }) => {
	const running_task = linkcase_extract_running_tasks.get(args.article_id)

	if (running_task) {
		return running_task
	}

	const task = (async () => {
		const content_chunks = await waitForArticlePipeline(args.article_id)
		const created_at = (await getPipelineTask(args.article_id))?.created_at ?? null
		const triples = await getTriples(args.content)
		const total_count = triples.length

		await patchPipelineTask({
			article_id: args.article_id,
			task: {
				status_text: `Extracting graph 0/${total_count}`
			}
		})

		for (const [index, triple] of triples.entries()) {
			assertPipelineTaskNotCancelled({ article_id: args.article_id, created_at })

			const head_name = normalizeTripleText(triple.head)
			const tail_name = normalizeTripleText(triple.tail)
			const relation = normalizeTripleText(triple.relation)

			if (!head_name || !tail_name || !relation) {
				continue
			}

			const [head_node, tail_node] = await Promise.all([
				ensureGlobalNode(head_name),
				ensureGlobalNode(tail_name)
			])

			if (!head_node || !tail_node) {
				continue
			}

			const edge_item = await ensureGlobalEdge({
				source_id: head_node.id,
				target_id: tail_node.id,
				source_name: head_name,
				target_name: tail_name,
				relation
			})

			if (edge_item) {
				await addEdgeArticle(edge_item.id, args.article_id)
			}

			await linkNodesToChunks([head_node.id, tail_node.id], content_chunks, [head_name, tail_name])

			await patchPipelineTask({
				article_id: args.article_id,
				task: {
					status_text: `Extracting graph ${index + 1}/${total_count}`
				}
			})
		}

		const current_article = await getArticle(eq(article.id, args.article_id))

		if (current_article) {
			const metadata_object = getArticleMetadataObject(current_article.metadata)
			const article_updated_at = current_article.updated_at || new Date()

			await setArticle(eq(article.id, args.article_id), {
				metadata: {
					...metadata_object,
					graph_backfill: {
						status: 'done',
						synced_at: new Date().toISOString(),
						article_updated_at: getUpdatedAtToken(article_updated_at),
						triple_count: triples.length
					}
				},
				is_pipelined: true,
				updated_at: article_updated_at
			})

			await removePipelineTask(args.article_id, {
				done_at: new Date().toISOString(),
				status: 'done'
			})
		}
	})()

	linkcase_extract_running_tasks.set(args.article_id, task)

	void task
		.catch(error => {
			if (isPipelineTaskCancelledError(error)) {
				void removePipelineTask(args.article_id, { archive: false })

				return
			}

			void patchPipelineTask({
				article_id: args.article_id,
				task: {
					status: 'error',
					done_at: new Date().toISOString(),
					error_message: error instanceof Error ? error.message : String(error),
					status_text: null
				}
			})

			log('SAVE', 'linkcaseExtractTaskError', () => ({
				id: args.id,
				article_id: args.article_id,
				error: error instanceof Error ? error.message : String(error)
			}))
		})
		.finally(() => {
			linkcase_extract_running_tasks.delete(args.article_id)
		})

	return task
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

	if (article_item && isArticleGraphBackfillDoneCurrent(article_item) && !args.force) {
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
			reused_article: true,
			is_pipelined: true,
			queued: false
		}
	}

	if (article_item?.id) {
		if (linkcase_extract_running_tasks.has(article_item.id)) {
			return {
				id: item.id,
				title: item.title,
				url: item.url,
				article_id: article_item.id,
				triple_count: 0,
				chunk_count: 0,
				reused_article: true,
				is_pipelined: false,
				queued: true
			}
		}

		const pipeline_task = (await readPipelineStore())[article_item.id]

		if (pipeline_task?.status === 'running' || pipeline_task?.status === 'queued') {
			return {
				id: item.id,
				title: item.title,
				url: item.url,
				article_id: article_item.id,
				triple_count: 0,
				chunk_count: 0,
				reused_article: true,
				is_pipelined: false,
				queued: true
			}
		}
	}

	const article_id = await saveArticle({
		article_id: article_item?.id,
		title: article_item?.title || item.title,
		content,
		for: 'linkcase',
		exec_pipeline: true,
		await_graph_sync: true
	})
	runLinkcaseExtractTask({
		id: item.id,
		article_id,
		content
	})

	return {
		id: item.id,
		title: item.title,
		url: item.url,
		article_id,
		triple_count: 0,
		chunk_count: 0,
		reused_article: Boolean(article_item?.id),
		is_pipelined: false,
		queued: true
	}
}

export const previewLinkcaseLinkWithProvider = async (args: {
	id: string
	provider: WebfetchFallbackProvider
	max_chars?: number
	page_size?: number
}) => {
	const current_link = await getLink(eq(link.id, args.id))

	if (!current_link) {
		throw new Error(`Link not found: ${args.id}`)
	}

	cleanupLinkcaseFetchPreviewCache()

	const max_chars = args.max_chars ?? DEFAULT_LINKCASE_FETCH_MAX_CHARS
	const result = await fetchWithProvider(args.provider, current_link.url, max_chars)
	const preview_key = crypto.randomUUID()
	const preview_page = getPreviewPage(result.content, 1, args.page_size)

	linkcase_fetch_preview_cache.set(preview_key, {
		id: current_link.id,
		url: current_link.url,
		title: result.title?.trim() || current_link.title || current_link.url,
		fetched_title: result.title?.trim() || null,
		source: args.provider,
		content: result.content,
		truncated: result.truncated,
		created_at: Date.now()
	})

	return {
		ok: true as const,
		id: current_link.id,
		title: result.title?.trim() || current_link.title,
		url: current_link.url,
		source: args.provider,
		truncated: result.truncated,
		content_preview: preview_page.content_preview,
		content_preview_start: preview_page.content_preview_start,
		content_preview_end: preview_page.content_preview_end,
		content_length: result.content.length,
		page: preview_page.page,
		page_size: preview_page.page_size,
		page_count: preview_page.page_count,
		has_prev_page: preview_page.has_prev_page,
		has_next_page: preview_page.has_next_page,
		preview_key
	}
}

export const readLinkcasePreview = async (args: { preview_key: string; page: number; page_size?: number }) => {
	cleanupLinkcaseFetchPreviewCache()

	const cached = linkcase_fetch_preview_cache.get(args.preview_key)

	if (!cached) {
		throw new Error(`Preview not found or expired: ${args.preview_key}`)
	}

	const preview_page = getPreviewPage(cached.content, args.page, args.page_size)

	return {
		ok: true as const,
		id: cached.id,
		title: cached.title,
		url: cached.url,
		source: cached.source,
		truncated: cached.truncated,
		content_length: cached.content.length,
		page: preview_page.page,
		page_size: preview_page.page_size,
		page_count: preview_page.page_count,
		content_preview: preview_page.content_preview,
		content_preview_start: preview_page.content_preview_start,
		content_preview_end: preview_page.content_preview_end,
		has_prev_page: preview_page.has_prev_page,
		has_next_page: preview_page.has_next_page,
		preview_key: args.preview_key
	}
}

export const commitLinkcasePreview = async (args: {
	preview_key: string
	content: string
	exec_pipeline?: boolean
}) => {
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

	const normalized_content = assertLinkcaseCommittedContentPreservesOriginalText({
		content: args.content,
		preview_content: cached.content
	})

	const saved = await saveLinkcaseArticle({
		id: current_link.id,
		url: current_link.url,
		title: current_link.title,
		fetched_title: cached.fetched_title,
		content: preserveLinkcasePreviewKeyUrls({
			content: normalized_content,
			preview_content: cached.content
		}),
		exec_pipeline: args.exec_pipeline
	})

	linkcase_fetch_preview_cache.delete(args.preview_key)

	return {
		ok: true as const,
		id: current_link.id,
		title: saved.link?.title || cached.fetched_title || current_link.title,
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
			url: current_link.url,
			title: current_link.title,
			fetched_title: result.title,
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

export const runLinkcaseScheduledExtractBatch = async (args: { count: number; concurrency: number }) => {
	const concurrency = Math.min(Math.max(Number(args.concurrency) || 1, 1), LINKCASE_EXTRACT_FASTQ_MAX_CONCURRENCY)

	return withLinkcaseBatchRunLock('extract', async () => {
		const targets = await listBatchExtractCandidates(args.count)
		const queue = fastq.promise(async (id: string) => extractLinkcaseArticle({ id, force: false }), concurrency)
		const extracted = await Promise.all(targets.map(item => queue.push(item.id)))

		return {
			ok: true as const,
			fetch_count: 0,
			extract_count: extracted.length,
			fetched: [],
			extracted
		}
	})
}

export const runLinkcaseBatch = async (args: { count: number; run_fetch: boolean; run_extract: boolean }) => {
	if (!args.run_fetch && !args.run_extract) {
		throw new Error('Select at least one batch action.')
	}

	const action = args.run_fetch && args.run_extract ? 'fetch + extract' : args.run_fetch ? 'fetch' : 'extract'

	return withLinkcaseBatchRunLock(action, async () => {
		const fetched = [] as Array<{
			id: string
			title: string
			url: string
			ok: boolean
			status: LinkcaseStatus
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
	})
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
