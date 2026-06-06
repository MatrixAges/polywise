import path from 'path'
import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { article, chunk, edge, node, post_article, post_project, post_session, project } from '@core/db/schema'
import { addEdge, addNode, addSession, getArticle, getChunks, getEdge, getNode } from '@core/db/services'
import { addEdgeArticle, addNodeChunk, addPostSession, getPostSessions } from '@core/db/services/externals'
import { env } from '@core/env'
import { remove, saveArticle } from '@core/io'
import { readPipelineStore } from '@core/io/save/pipelineStore'
import { getEmbedding, getTriples } from '@core/pipeline'
import { log } from '@core/utils'
import grep from '@core/utils/grep'
import dayjs from 'dayjs'
import { and, asc, desc, eq, inArray, like, notInArray, or, sql } from 'drizzle-orm'

import removeSessionById from '../session/utils/removeSessionById'

export const post_for_types = ['user', 'wiki', 'memory'] as const
export type PostForType = (typeof post_for_types)[number]
export const post_list_tabs = ['user', 'wiki', 'memory', 'agent'] as const
export type PostListTab = (typeof post_list_tabs)[number]

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
const post_list_tab_set = new Set<string>(post_list_tabs)
const global_post_scope_where = eq(article.scope_type, 'global')
const pthink_post_where = sql`json_extract(${article.metadata}, '$.pthink.kind') IS NOT NULL`
const message_bookmark_post_where = sql`json_extract(${article.metadata}, '$.save_origin') = 'message_bookmark'`
const default_post_visibility_where = and(
	global_post_scope_where,
	sql`json_extract(${article.metadata}, '$.pthink.kind') IS NULL`,
	sql`coalesce(json_extract(${article.metadata}, '$.save_origin'), '') != 'message_bookmark'`
)
const agent_post_visibility_where = and(
	global_post_scope_where,
	or(pthink_post_where, and(eq(article.for, 'wiki'), message_bookmark_post_where))
)
const visible_related_article_count = sql<number>`(
	select count(*)
	from post_article pa
	inner join article related_article on pa.article_id = related_article.id
	where pa.post_id = ${article.id}
		and related_article.scope_type = 'global'
)`

export const isPostForType = (value?: string | null): value is PostForType =>
	typeof value === 'string' && post_for_type_set.has(value)

export const isPostListTab = (value?: string | null): value is PostListTab =>
	typeof value === 'string' && post_list_tab_set.has(value)

export const normalizePostForType = (value?: string | null): PostForType => (isPostForType(value) ? value : 'user')
export const normalizePostListTab = (value?: string | null): PostListTab => (isPostListTab(value) ? value : 'wiki')

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
			related_article_count: visible_related_article_count,
			session_id: sql<
				string | null
			>`(select ${post_session.session_id} from ${post_session} where ${post_session.post_id} = ${article.id} limit 1)`
		})
		.from(article)
		.where(and(eq(article.id, id), inArray(article.for, post_for_types), global_post_scope_where))
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

			const edge_item = await ensureGlobalEdge(head_node.id, tail_node.id, relation)

			if (edge_item) {
				await addEdgeArticle(edge_item.id, args.article_id)
			}

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
		.where(and(eq(post_article.post_id, post_id), global_post_scope_where))
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

export const listPostRelatedProjects = async (post_id: string) => {
	return env.db
		.select({
			id: project.id,
			name: project.name,
			dir: project.dir,
			created_at: project.created_at,
			updated_at: project.updated_at
		})
		.from(post_project)
		.innerJoin(project, eq(post_project.project_id, project.id))
		.where(eq(post_project.post_id, post_id))
		.orderBy(desc(post_project.created_at), project.order, desc(project.updated_at), asc(project.created_at))
}

const splitRelatedSearchTerms = (query: string) => {
	const raw = query.trim()

	if (!raw) {
		return []
	}

	const parts = raw
		.split(/[\s,，。！？!?:：;；、/\\|()[\]{}"'`]+/u)
		.map(item => item.trim())
		.filter(Boolean)

	const embedded_identifier_matches = raw.match(/[@a-zA-Z][@a-zA-Z0-9._/-]*/g) ?? []
	const normalized_identifiers = embedded_identifier_matches
		.map(item => item.replace(/^[./-]+|[./-]+$/g, '').trim())
		.filter(item => item.length >= 2)

	return Array.from(new Set([raw, ...parts.filter(item => item.length >= 2), ...normalized_identifiers])).slice(
		0,
		12
	)
}

const getRelatedSnippet = (content: string, terms: Array<string>) => {
	const text = content.replace(/\s+/g, ' ').trim()

	if (!text) {
		return ''
	}

	const lower_text = text.toLowerCase()
	const first_match_index = terms
		.map(term => lower_text.indexOf(term.toLowerCase()))
		.filter(index => index >= 0)
		.sort((a, b) => a - b)[0]

	if (typeof first_match_index !== 'number') {
		return text.slice(0, 240)
	}

	const start = Math.max(0, first_match_index - 90)
	const end = Math.min(text.length, first_match_index + 150)
	const snippet = text.slice(start, end)

	return `${start > 0 ? '...' : ''}${snippet}${end < text.length ? '...' : ''}`
}

const getRelatedSourceScore = (args: {
	query: string
	terms: Array<string>
	title: string | null
	content: string
	keywords?: string | null
	updated_at: Date | null
}) => {
	const { query, terms, title, content, keywords = '', updated_at } = args
	const lower_query = query.trim().toLowerCase()
	const haystack = `${title ?? ''}\n${content}\n${keywords}`.toLowerCase()
	const lower_title = (title ?? '').toLowerCase()
	let score = 0

	if (lower_query && haystack.includes(lower_query)) {
		score += 8
	}

	if (lower_query && lower_title.includes(lower_query)) {
		score += 5
	}

	for (const term of terms) {
		const lower_term = term.toLowerCase()

		if (haystack.includes(lower_term)) {
			score += term === query ? 3 : 1.5
		}

		if (lower_title.includes(lower_term)) {
			score += 1.5
		}
	}

	if (updated_at) {
		const day_ms = 24 * 60 * 60 * 1000
		const days_ago = Math.max(0, (Date.now() - updated_at.getTime()) / day_ms)

		score += 1 / (1 + days_ago * 0.1)
	}

	return score
}

const normalizeRelatedSourceMaxResults = (value?: number) => Math.min(Math.max(value ?? 5, 1), 8)

const getRelatedProjectFileScore = (args: {
	query: string
	terms: Array<string>
	project_name: string
	relative_path: string
	content: string
	updated_at: Date | null
}) => {
	const { query, terms, project_name, relative_path, content, updated_at } = args
	const lower_query = query.trim().toLowerCase()
	const lower_path = relative_path.toLowerCase()
	const haystack = `${project_name}\n${relative_path}\n${content}`.toLowerCase()
	let score = 0

	if (lower_query && haystack.includes(lower_query)) {
		score += 8
	}

	if (lower_query && lower_path.includes(lower_query)) {
		score += 4
	}

	for (const term of terms) {
		const lower_term = term.toLowerCase()

		if (haystack.includes(lower_term)) {
			score += term === query ? 3 : 1.5
		}

		if (lower_path.includes(lower_term)) {
			score += 2
		}
	}

	if (updated_at) {
		const day_ms = 24 * 60 * 60 * 1000
		const days_ago = Math.max(0, (Date.now() - updated_at.getTime()) / day_ms)

		score += 1 / (1 + days_ago * 0.1)
	}

	return score
}

const parseProjectMatchLine = (line: string) => {
	const match = /^(.*?):(\d+):(.*)$/u.exec(line)

	if (!match) {
		return null
	}

	return {
		absolute_path: path.resolve(match[1]),
		line: Number(match[2]),
		content: match[3].trim()
	}
}

const normalizeProjectDir = (dir: string) => {
	const resolved = path.resolve(dir)

	if (resolved === path.sep) {
		return resolved
	}

	return resolved.replace(new RegExp(`${path.sep.replace(/\\/g, '\\\\')}+$`, 'u'), '')
}

const resolveMatchedProject = (
	related_projects: Array<Awaited<ReturnType<typeof listPostRelatedProjects>>[number]>,
	absolute_path: string
) =>
	related_projects.find(project_row => {
		const normalized_dir = normalizeProjectDir(project_row.dir)

		return absolute_path === normalized_dir || absolute_path.startsWith(`${normalized_dir}${path.sep}`)
	})

export const searchPostRelatedArticleSources = async (args: {
	post_id: string
	query: string
	max_results?: number
}) => {
	const query = args.query.trim()

	if (!query) {
		return {
			query,
			related_article_count: 0,
			results: []
		}
	}

	const related_articles = await env.db
		.select({
			id: article.id,
			title: article.title,
			content: article.content,
			for_type: article.for,
			updated_at: article.updated_at
		})
		.from(post_article)
		.innerJoin(article, eq(post_article.article_id, article.id))
		.where(eq(post_article.post_id, args.post_id))

	if (related_articles.length === 0) {
		return {
			query,
			related_article_count: 0,
			results: []
		}
	}

	const related_article_ids = related_articles.map(item => item.id)
	const related_chunks = await getChunks({
		where: inArray(chunk.article_id, related_article_ids),
		orderBy: [desc(chunk.created_at), asc(chunk.position)]
	})
	const terms = splitRelatedSearchTerms(query)
	const max_results = normalizeRelatedSourceMaxResults(args.max_results)
	const chunk_map = new Map<string, Array<(typeof related_chunks)[number]>>()

	for (const item of related_chunks) {
		if (!item.article_id) {
			continue
		}

		const list = chunk_map.get(item.article_id) ?? []

		list.push(item)
		chunk_map.set(item.article_id, list)
	}

	const results = related_articles
		.map(article_item => {
			const article_chunks = chunk_map.get(article_item.id) ?? []
			const chunk_hits = article_chunks
				.map(chunk_item => {
					const content = chunk_item.content ?? ''
					const score = getRelatedSourceScore({
						query,
						terms,
						title: article_item.title,
						content,
						keywords: chunk_item.keywords,
						updated_at: article_item.updated_at
					})

					return {
						content,
						keywords: chunk_item.keywords,
						score
					}
				})
				.filter(item => item.score > 0)
				.sort((a, b) => b.score - a.score)
			const best_chunk = chunk_hits[0]
			const article_score = getRelatedSourceScore({
				query,
				terms,
				title: article_item.title,
				content: article_item.content,
				updated_at: article_item.updated_at
			})
			const best_score = Math.max(best_chunk?.score ?? 0, article_score)

			if (best_score <= 0) {
				return null
			}

			const snippet_source = best_chunk?.content || article_item.content
			const matched_terms = terms.filter(term =>
				`${article_item.title ?? ''}\n${snippet_source}`.toLowerCase().includes(term.toLowerCase())
			)

			return {
				source_type: 'article' as const,
				article_id: article_item.id,
				title: article_item.title,
				for_type: article_item.for_type,
				score: Math.round(best_score * 100) / 100,
				updated_at: article_item.updated_at?.toISOString() ?? null,
				snippet: getRelatedSnippet(snippet_source, matched_terms.length ? matched_terms : terms),
				matched_terms: matched_terms.slice(0, 6)
			}
		})
		.filter(item => item !== null)
		.sort((a, b) => b.score - a.score)
		.slice(0, max_results)

	return {
		query,
		related_article_count: related_articles.length,
		results
	}
}

export const searchPostRelatedProjectSources = async (args: {
	post_id: string
	query: string
	max_results?: number
}) => {
	const query = args.query.trim()

	if (!query) {
		return {
			query,
			related_project_count: 0,
			results: []
		}
	}

	const related_projects = await listPostRelatedProjects(args.post_id)

	if (related_projects.length === 0) {
		return {
			query,
			related_project_count: 0,
			results: []
		}
	}

	const terms = splitRelatedSearchTerms(query)
	const max_results = normalizeRelatedSourceMaxResults(args.max_results)
	const sorted_related_projects = [...related_projects].sort((a, b) => b.dir.length - a.dir.length)
	const raw_lines = await grep(
		related_projects.map(item => item.dir),
		terms.length > 0 ? terms : query,
		{
			glob: [
				'!**/node_modules/**',
				'!**/dist/**',
				'!**/build/**',
				'!**/.next/**',
				'!**/.turbo/**',
				'!**/coverage/**',
				'!**/pnpm-lock.yaml',
				'!**/package-lock.json',
				'!**/yarn.lock'
			],
			max_count: Math.max(max_results * 10, 40),
			with_filename: true,
			with_line_number: true
		}
	)
	const file_hit_map = new Map<
		string,
		{
			source_type: 'project_file'
			project_id: string
			project_name: string
			absolute_path: string
			relative_path: string
			line: number
			score: number
			snippet: string
			matched_terms: Array<string>
			match_count: number
		}
	>()

	for (const raw_line of raw_lines) {
		const item = parseProjectMatchLine(raw_line)

		if (!item) {
			continue
		}

		const project_item = resolveMatchedProject(sorted_related_projects, item.absolute_path)

		if (!project_item) {
			continue
		}

		const relative_path =
			path.relative(project_item.dir, item.absolute_path) || path.basename(item.absolute_path)
		const score = getRelatedProjectFileScore({
			query,
			terms,
			project_name: project_item.name,
			relative_path,
			content: item.content,
			updated_at: project_item.updated_at
		})

		if (score <= 0) {
			continue
		}

		const matched_terms = terms.filter(term =>
			`${project_item.name}\n${relative_path}\n${item.content}`.toLowerCase().includes(term.toLowerCase())
		)
		const file_key = `${project_item.id}:${relative_path}`
		const current = file_hit_map.get(file_key)
		const next_score = Math.round(score * 100) / 100

		if (!current || next_score > current.score) {
			file_hit_map.set(file_key, {
				source_type: 'project_file',
				project_id: project_item.id,
				project_name: project_item.name,
				absolute_path: item.absolute_path,
				relative_path,
				line: item.line,
				score: next_score,
				snippet: getRelatedSnippet(item.content, matched_terms.length ? matched_terms : terms),
				matched_terms: matched_terms.slice(0, 6),
				match_count: (current?.match_count ?? 0) + 1
			})

			continue
		}

		current.match_count += 1
	}

	const results = Array.from(file_hit_map.values())
		.map(item => ({
			...item,
			score: Math.round((item.score + Math.min(item.match_count - 1, 3) * 0.35) * 100) / 100
		}))
		.sort((a, b) => b.score - a.score)
		.slice(0, max_results)

	return {
		query,
		related_project_count: related_projects.length,
		results
	}
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
				global_post_scope_where,
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

export const queryPosts = async (args: { page: number; tab?: string; for_type?: string; query?: string }) => {
	const page_size = 12
	const target_tab = normalizePostListTab(args.tab)
	const target_for_type = args.for_type && isPostForType(args.for_type) ? args.for_type : undefined
	const keyword = args.query?.trim() ?? ''
	const type_where =
		target_tab === 'agent'
			? inArray(article.for, post_for_types)
			: target_for_type
				? eq(article.for, target_for_type)
				: inArray(article.for, post_for_types)
	const search_where = keyword
		? or(like(article.title, `%${keyword}%`), like(article.content, `%${keyword}%`))
		: undefined
	const visibility_where = target_tab === 'agent' ? agent_post_visibility_where : default_post_visibility_where
	const where = search_where ? and(visibility_where, type_where, search_where) : and(visibility_where, type_where)
	const rows = await env.db
		.select({
			id: article.id,
			title: article.title,
			content: article.content,
			for_type: article.for,
			is_pipelined: article.is_pipelined,
			created_at: article.created_at,
			updated_at: article.updated_at,
			related_article_count: visible_related_article_count,
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
