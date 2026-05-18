import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { article, chunk, edge, node, post_article, post_session } from '@core/db/schema'
import { addEdge, addNode, addSession, getArticle, getChunks, getEdge, getNode } from '@core/db/services'
import { addNodeChunk, addPostSession, getPostSessions } from '@core/db/services/externals'
import { env } from '@core/env'
import { remove, saveArticle } from '@core/io'
import { readPipelineStore } from '@core/io/save/pipelineStore'
import { getEmbedding, getTriples } from '@core/pipeline'
import { log } from '@core/utils'
import dayjs from 'dayjs'
import { and, asc, desc, eq, inArray, like, notInArray, or, sql } from 'drizzle-orm'

import removeSessionById from '../session/utils/removeSessionById'

export const post_for_types = ['user', 'wiki', 'memory'] as const
export type PostForType = (typeof post_for_types)[number]

const post_extract_running_tasks = new Map<string, Promise<void>>()
const post_session_ensure_tasks = new Map<
	string,
	Promise<{
		session_id: string
		created: boolean
	}>
>()
const POST_PIPELINE_WAIT_MS = 90_000
const POST_PIPELINE_POLL_MS = 250
const post_for_type_set = new Set<string>(post_for_types)

export const isPostForType = (value?: string | null): value is PostForType =>
	typeof value === 'string' && post_for_type_set.has(value)

export const normalizePostForType = (value?: string | null): PostForType => (isPostForType(value) ? value : 'user')

export const getPostSessionTitle = (post: { title: string | null; for_type: PostForType }) => {
	const title = post.title?.trim()

	if (title) {
		return `Post · ${title}`
	}

	return `Post · ${post.for_type} · ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
}

export const getPostPreview = (content: string) => content.replace(/\s+/g, ' ').trim().slice(0, 180)

type PostRecord = {
	id: string
	title: string | null
	content: string
	for_type: PostForType
	is_pipelined: boolean
	created_at: Date | null
	updated_at: Date | null
	related_article_count: number
	session_id: string | null
}

const mapPostRow = (row: {
	id: string
	title: string | null
	content: string
	for_type: string
	is_pipelined: boolean
	created_at: Date | null
	updated_at: Date | null
	related_article_count: number
	session_id: string | null
}): PostRecord => ({
	id: row.id,
	title: row.title,
	content: row.content,
	for_type: normalizePostForType(row.for_type),
	is_pipelined: Boolean(row.is_pipelined),
	created_at: row.created_at,
	updated_at: row.updated_at,
	related_article_count: Number(row.related_article_count || 0),
	session_id: row.session_id ?? null
})

export const getPostById = async (id: string) => {
	const row = await env.db
		.select({
			id: article.id,
			title: article.title,
			content: article.content,
			for_type: article.for,
			is_pipelined: article.is_pipelined,
			created_at: article.created_at,
			updated_at: article.updated_at,
			related_article_count: sql<number>`(select count(*) from ${post_article} where ${post_article.post_id} = ${article.id})`,
			session_id: sql<
				string | null
			>`(select ${post_session.session_id} from ${post_session} where ${post_session.post_id} = ${article.id} limit 1)`
		})
		.from(article)
		.where(and(eq(article.id, id), inArray(article.for, post_for_types)))
		.limit(1)
		.then(res => res[0])

	return row ? mapPostRow(row) : null
}

export const ensurePostSession = async (post_id: string) => {
	const running_task = post_session_ensure_tasks.get(post_id)

	if (running_task) {
		return running_task
	}

	const task = (async () => {
		const existing = await getPostSessions({
			where: eq(post_session.post_id, post_id)
		}).then(res => res[0])

		if (existing) {
			return {
				session_id: existing.session.id,
				created: false
			}
		}

		const post = await getPostById(post_id)

		if (!post) {
			throw new Error(`Post not found: ${post_id}`)
		}

		const created_session = await addSession({
			title: getPostSessionTitle(post)
		})

		try {
			await addPostSession(post_id, created_session.id)
		} catch (error) {
			const linked_session = await getPostSessions({
				where: eq(post_session.post_id, post_id)
			}).then(res => res[0])

			if (linked_session) {
				await removeSessionById(created_session.id).catch(() => null)

				return {
					session_id: linked_session.session.id,
					created: false
				}
			}

			throw error
		}

		return {
			session_id: created_session.id,
			created: true
		}
	})().finally(() => {
		post_session_ensure_tasks.delete(post_id)
	})

	post_session_ensure_tasks.set(post_id, task)

	return task
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const normalizeTripleText = (value: string) => value.replace(/\s+/g, ' ').trim()

const waitForArticlePipeline = async (article_id: string) => {
	const deadline = Date.now() + POST_PIPELINE_WAIT_MS

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

		if (current_article?.is_pipelined) {
			return current_chunks
		}

		await sleep(POST_PIPELINE_POLL_MS)
	}

	throw new Error(`Timed out while waiting for article pipeline: ${article_id}`)
}

const ensureGlobalNode = async (name: string) => {
	const normalized_name = normalizeTripleText(name)

	if (!normalized_name) {
		return null
	}

	const existing = await getNode(and(sql`${node.agent_id} is null`, eq(node.name, normalized_name)))

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

const runPostExtractTask = (args: { id: string; article_id: string; content: string }) => {
	const running_task = post_extract_running_tasks.get(args.article_id)

	if (running_task) {
		return running_task
	}

	const task = (async () => {
		const content_chunks = await waitForArticlePipeline(args.article_id)
		const triples = await getTriples(args.content)

		for (const triple of triples) {
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

			await ensureGlobalEdge(head_node.id, tail_node.id, relation)
			await linkNodesToChunks([head_node.id, tail_node.id], content_chunks, [head_name, tail_name])
		}
	})()

	post_extract_running_tasks.set(args.article_id, task)

	void task
		.catch(error => {
			log('SAVE', 'postExtractTaskError', () => ({
				id: args.id,
				article_id: args.article_id,
				error: error instanceof Error ? error.message : String(error)
			}))
		})
		.finally(() => {
			post_extract_running_tasks.delete(args.article_id)
		})

	return task
}

export const extractPostArticle = async (args: { id: string; force?: boolean }) => {
	const post = await getPostById(args.id)

	if (!post) {
		throw new Error(`Post not found: ${args.id}`)
	}

	const content = post.content.trim()

	if (!content) {
		throw new Error('No content available to extract.')
	}

	if (post.is_pipelined && !args.force) {
		const content_chunks = await getChunks({
			where: eq(chunk.article_id, post.id),
			orderBy: asc(chunk.position)
		})

		return {
			id: post.id,
			title: post.title || '',
			article_id: post.id,
			triple_count: 0,
			chunk_count: content_chunks.length,
			reused_article: true,
			is_pipelined: true,
			queued: false
		}
	}

	if (post_extract_running_tasks.has(post.id)) {
		return {
			id: post.id,
			title: post.title || '',
			article_id: post.id,
			triple_count: 0,
			chunk_count: 0,
			reused_article: true,
			is_pipelined: false,
			queued: true
		}
	}

	const pipeline_task = (await readPipelineStore())[post.id]

	if (pipeline_task?.status === 'running') {
		return {
			id: post.id,
			title: post.title || '',
			article_id: post.id,
			triple_count: 0,
			chunk_count: 0,
			reused_article: true,
			is_pipelined: false,
			queued: true
		}
	}

	await saveArticle({
		article_id: post.id,
		title: post.title,
		content: post.content,
		for: post.for_type,
		exec_pipeline: true
	})
	runPostExtractTask({
		id: post.id,
		article_id: post.id,
		content: post.content
	})

	return {
		id: post.id,
		title: post.title || '',
		article_id: post.id,
		triple_count: 0,
		chunk_count: 0,
		reused_article: true,
		is_pipelined: false,
		queued: true
	}
}

export const removePostById = async (id: string) => {
	const post = await getPostById(id)

	if (!post) {
		return null
	}

	if (post.session_id) {
		await removeSessionById(post.session_id)
	}

	await remove(id)

	return post
}

export const listPostRelatedArticles = async (post_id: string) => {
	return env.db
		.select({
			id: article.id,
			title: article.title,
			for_type: article.for,
			created_at: article.created_at,
			updated_at: article.updated_at,
			content_preview: article.content
		})
		.from(post_article)
		.innerJoin(article, eq(post_article.article_id, article.id))
		.where(eq(post_article.post_id, post_id))
		.orderBy(desc(post_article.created_at), desc(article.updated_at), asc(article.created_at))
		.then(rows =>
			rows.map(row => ({
				id: row.id,
				title: row.title,
				for_type: row.for_type,
				created_at: row.created_at,
				updated_at: row.updated_at,
				content_preview: getPostPreview(row.content_preview)
			}))
		)
}

export const searchRelatedArticleCandidates = async (args: { post_id: string; query: string; page: number }) => {
	const keyword = args.query.trim()

	if (!keyword) {
		return { list: [], has_more: false }
	}

	const related_rows = await env.db
		.select({ article_id: post_article.article_id })
		.from(post_article)
		.where(eq(post_article.post_id, args.post_id))
	const exclude_ids = [args.post_id, ...related_rows.map(item => item.article_id)]
	const page_size = 10

	const rows = await env.db
		.select({
			id: article.id,
			title: article.title,
			for_type: article.for,
			created_at: article.created_at,
			updated_at: article.updated_at,
			content_preview: article.content
		})
		.from(article)
		.where(
			and(
				notInArray(article.id, exclude_ids),
				or(like(article.title, `%${keyword}%`), like(article.content, `%${keyword}%`))
			)
		)
		.orderBy(desc(article.updated_at), asc(article.created_at))
		.limit(page_size + 1)
		.offset((args.page - 1) * page_size)

	const has_more = rows.length > page_size
	const list = (has_more ? rows.slice(0, page_size) : rows).map(row => ({
		id: row.id,
		title: row.title,
		for_type: row.for_type,
		created_at: row.created_at,
		updated_at: row.updated_at,
		content_preview: getPostPreview(row.content_preview)
	}))

	return { list, has_more }
}

export const queryPosts = async (args: { page: number; for_type?: string }) => {
	const page_size = 12
	const target_for_type = args.for_type && isPostForType(args.for_type) ? args.for_type : undefined
	const where = target_for_type ? eq(article.for, target_for_type) : inArray(article.for, post_for_types)
	const rows = await env.db
		.select({
			id: article.id,
			title: article.title,
			content: article.content,
			for_type: article.for,
			is_pipelined: article.is_pipelined,
			created_at: article.created_at,
			updated_at: article.updated_at,
			related_article_count: sql<number>`(select count(*) from ${post_article} where ${post_article.post_id} = ${article.id})`,
			session_id: sql<
				string | null
			>`(select ${post_session.session_id} from ${post_session} where ${post_session.post_id} = ${article.id} limit 1)`
		})
		.from(article)
		.where(where)
		.orderBy(desc(article.updated_at), asc(article.created_at))
		.limit(page_size + 1)
		.offset((args.page - 1) * page_size)

	const has_more = rows.length > page_size
	const list = (has_more ? rows.slice(0, page_size) : rows).map(row => {
		const item = mapPostRow(row)

		return {
			id: item.id,
			title: item.title,
			for_type: item.for_type,
			is_pipelined: item.is_pipelined,
			created_at: item.created_at,
			updated_at: item.updated_at,
			related_article_count: item.related_article_count,
			session_id: item.session_id,
			content_preview: getPostPreview(item.content),
			has_session: Boolean(item.session_id)
		}
	})

	return {
		list,
		has_more
	}
}
