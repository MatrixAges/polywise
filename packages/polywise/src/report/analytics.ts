import { config, providers } from '@core/config'
import { env } from '@core/env'

import { getReportWindow } from './utils'

import type {
	ReportAgentChangeItem,
	ReportAnalytics,
	ReportConversationSample,
	ReportModelUsageItem,
	ReportPeriod,
	ReportProviderUsageItem,
	ReportSessionItem
} from './types'

const organic_post_filter = `json_extract(metadata, '$.pthink.kind') IS NULL`
const second_ms = 1000

const normalizeDbParam = (value: unknown) =>
	typeof value === 'number' && Number.isFinite(value) && Math.abs(value) >= 1_000_000_000_000
		? Math.floor(value / second_ms)
		: value

const countValue = (query: string, params: Array<unknown> = []) => {
	const row = env.sqlite.prepare(query).get(...params.map(normalizeDbParam)) as { value?: number } | undefined

	return Number(row?.value ?? 0)
}

const parseMessageText = (value: string) => {
	try {
		const parsed = JSON.parse(value) as {
			content?: unknown
			parts?: Array<Record<string, unknown>>
		}
		const direct =
			typeof parsed.content === 'string'
				? parsed.content
				: Array.isArray(parsed.content)
					? parsed.content.join('\n')
					: ''
		const part_text = Array.isArray(parsed.parts)
			? parsed.parts
					.map(part => {
						if (typeof part.text === 'string') return part.text
						if (typeof part.input === 'string') return part.input
						if (part.type === 'reasoning' && typeof part.text === 'string') return part.text

						return ''
					})
					.filter(Boolean)
					.join('\n')
			: ''
		const text = (direct || part_text).replace(/\s+/g, ' ').trim()

		return text.slice(0, 800)
	} catch {
		return ''
	}
}

const parseModelConfig = (value: unknown) => {
	if (!value || typeof value !== 'string') {
		return null
	}

	try {
		const parsed = JSON.parse(value) as {
			provider?: string
			model?: string
		}

		if (typeof parsed.provider !== 'string' || typeof parsed.model !== 'string') {
			return null
		}

		return parsed
	} catch {
		return null
	}
}

const getModelKey = (value: { provider?: string; model?: string } | null | undefined) => {
	if (!value?.provider || !value?.model) {
		return 'unknown'
	}

	return `${value.provider}:${value.model}`
}

const formatModelName = (value: { provider?: string; model?: string } | null | undefined) => {
	if (!value?.provider || !value?.model) {
		return 'Unknown'
	}

	return `${value.provider} / ${value.model}`
}

const readUsageBreakdown = (start_at: number, end_at: number) => {
	const rows = env.sqlite
		.prepare(
			`SELECT
				m.session_id AS session_id,
				m.created_at AS created_at,
				json_extract(m.content, '$.metadata.sender_id') AS sender_id,
				json_extract(m.content, '$.metadata.usage.inputTokens') AS input_tokens,
				json_extract(m.content, '$.metadata.usage.outputTokens') AS output_tokens,
				json_extract(m.content, '$.metadata.usage.totalTokens') AS total_tokens,
				json_extract(m.content, '$.metadata.usage.reasoningTokens') AS reasoning_tokens,
				json_extract(m.content, '$.metadata.usage.cachedInputTokens') AS cached_input_tokens
			FROM message m
			WHERE m.role = 'assistant'
				AND m.created_at >= ?
				AND m.created_at < ?
				AND json_extract(m.content, '$.metadata.usage.totalTokens') IS NOT NULL`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<{
		session_id: string
		created_at: number
		sender_id: string | null
		input_tokens: number | null
		output_tokens: number | null
		total_tokens: number | null
		reasoning_tokens: number | null
		cached_input_tokens: number | null
	}>
	const agent_rows = env.sqlite.prepare('SELECT id, model FROM agent').all() as Array<{
		id: string
		model: string | null
	}>
	const agent_model_map = new Map(agent_rows.map(item => [item.id, parseModelConfig(item.model)]))
	const session_agent_rows = env.sqlite
		.prepare(
			`SELECT
				ag.session_id AS session_id,
				a.model AS agent_model
			FROM agent_session ag
			INNER JOIN agent a ON ag.agent_id = a.id`
		)
		.all() as Array<{ session_id: string; agent_model: string | null }>
	const session_agent_map = new Map(
		session_agent_rows.map(item => [item.session_id, parseModelConfig(item.agent_model)])
	)
	const session_project_rows = env.sqlite
		.prepare(
			`SELECT
				ps.session_id AS session_id,
				p.model AS project_model
			FROM project_session ps
			INNER JOIN project p ON ps.project_id = p.id`
		)
		.all() as Array<{ session_id: string; project_model: string | null }>
	const session_project_map = new Map(
		session_project_rows.map(item => [item.session_id, parseModelConfig(item.project_model)])
	)
	const custom_list = providers.custom_providers ?? []
	const default_model = config.default_model
	const default_provider_name = custom_list.some(item => item.name === default_model.provider)
		? 'open_compatible'
		: default_model.provider
	const default_model_config = {
		provider: default_provider_name,
		model: default_model.model
	}
	const models = new Map<string, ReportModelUsageItem>()
	const providers_total = new Map<string, ReportProviderUsageItem>()
	let input_tokens = 0
	let output_tokens = 0
	let total_tokens = 0
	let reasoning_tokens = 0
	let cached_input_tokens = 0

	for (const row of rows) {
		const model_config =
			(row.sender_id ? agent_model_map.get(row.sender_id) : null) ||
			session_agent_map.get(row.session_id) ||
			session_project_map.get(row.session_id) ||
			default_model_config
		const key = getModelKey(model_config)
		const provider = model_config?.provider || 'unknown'
		const model_item = models.get(key) ?? {
			key,
			label: formatModelName(model_config),
			calls: 0,
			total_tokens: 0
		}
		const provider_item = providers_total.get(provider) ?? {
			provider,
			calls: 0,
			total_tokens: 0
		}
		const row_total_tokens = Number(row.total_tokens ?? 0)

		model_item.calls += 1
		model_item.total_tokens += row_total_tokens
		provider_item.calls += 1
		provider_item.total_tokens += row_total_tokens
		models.set(key, model_item)
		providers_total.set(provider, provider_item)
		input_tokens += Number(row.input_tokens ?? 0)
		output_tokens += Number(row.output_tokens ?? 0)
		total_tokens += row_total_tokens
		reasoning_tokens += Number(row.reasoning_tokens ?? 0)
		cached_input_tokens += Number(row.cached_input_tokens ?? 0)
	}

	return {
		models: Array.from(models.values())
			.sort((left, right) => right.total_tokens - left.total_tokens)
			.slice(0, 6),
		providers: Array.from(providers_total.values())
			.sort((left, right) => right.total_tokens - left.total_tokens)
			.slice(0, 6),
		input_tokens,
		output_tokens,
		total_tokens,
		reasoning_tokens,
		cached_input_tokens
	}
}

const readConversationSamples = (start_at: number, end_at: number, limit: number, only_im = false) => {
	const rows = env.sqlite
		.prepare(
			`SELECT
				m.session_id AS session_id,
				s.title AS title,
				s.im AS is_im,
				m.role AS role,
				m.content AS content,
				m.created_at AS created_at
			FROM message m
			INNER JOIN session s ON s.id = m.session_id
			WHERE m.created_at >= ?
				AND m.created_at < ?
				${only_im ? 'AND s.im = 1' : ''}
			ORDER BY m.created_at DESC
			LIMIT ?`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at), limit) as Array<{
		session_id: string
		title: string | null
		is_im: number | null
		role: string
		content: string
		created_at: number
	}>

	return rows
		.map(
			row =>
				({
					session_id: row.session_id,
					title: row.title || 'Untitled session',
					role: row.role,
					text: parseMessageText(row.content),
					created_at: Number(row.created_at ?? 0),
					is_im: Boolean(row.is_im)
				}) satisfies ReportConversationSample
		)
		.filter(item => item.text)
}

const readTopSessions = (start_at: number, end_at: number, only_im = false) => {
	const rows = env.sqlite
		.prepare(
			`SELECT
				s.id AS session_id,
				s.title AS title,
				s.im AS is_im,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_message_at
			FROM session s
			INNER JOIN message m ON m.session_id = s.id
			WHERE m.created_at >= ?
				AND m.created_at < ?
				${only_im ? 'AND s.im = 1' : ''}
			GROUP BY s.id, s.title, s.im
			ORDER BY message_count DESC, last_message_at DESC
			LIMIT 8`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<Record<string, unknown>>

	return rows.map(
		row =>
			({
				session_id: String(row.session_id ?? ''),
				title: String(row.title ?? 'Untitled session'),
				message_count: Number(row.message_count ?? 0),
				last_message_at: Number(row.last_message_at ?? 0),
				is_im: Boolean(row.is_im)
			}) satisfies ReportSessionItem
	)
}

const readTopProjects = (start_at: number, end_at: number) => {
	const rows = env.sqlite
		.prepare(
			`SELECT
				p.id AS project_id,
				p.name AS name,
				COUNT(DISTINCT ps.session_id) AS session_count,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_message_at
			FROM project p
			INNER JOIN project_session ps ON ps.project_id = p.id
			LEFT JOIN message m ON m.session_id = ps.session_id
				AND m.created_at >= ?
				AND m.created_at < ?
			GROUP BY p.id, p.name
			HAVING session_count > 0
			ORDER BY message_count DESC, last_message_at DESC
			LIMIT 6`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<Record<string, unknown>>

	return rows.map(row => ({
		project_id: String(row.project_id ?? ''),
		name: String(row.name ?? 'Untitled project'),
		session_count: Number(row.session_count ?? 0),
		message_count: Number(row.message_count ?? 0),
		last_message_at: Number(row.last_message_at ?? 0)
	}))
}

const readTopAgentChanges = (start_at: number, end_at: number) => {
	const session_rows = env.sqlite
		.prepare(
			`SELECT a.id AS agent_id, a.name AS name, COUNT(ag.session_id) AS value
			FROM agent a
			LEFT JOIN agent_session ag ON ag.agent_id = a.id
				AND ag.created_at >= ?
				AND ag.created_at < ?
			GROUP BY a.id, a.name`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<Record<string, unknown>>
	const article_rows = env.sqlite
		.prepare(
			`SELECT
				a.id AS agent_id,
				COUNT(aa.article_id) AS new_articles,
				SUM(CASE WHEN ar."for" = 'memory' THEN 1 ELSE 0 END) AS new_memory_posts,
				SUM(CASE WHEN ar."for" = 'wiki' THEN 1 ELSE 0 END) AS new_wiki_posts
			FROM agent a
			LEFT JOIN agent_article aa ON aa.agent_id = a.id
				AND aa.created_at >= ?
				AND aa.created_at < ?
			LEFT JOIN article ar ON aa.article_id = ar.id
			GROUP BY a.id`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<Record<string, unknown>>
	const article_map = new Map(article_rows.map(row => [String(row.agent_id ?? ''), row]))

	return session_rows
		.map(row => {
			const agent_id = String(row.agent_id ?? '')
			const article_row = article_map.get(agent_id)

			return {
				agent_id,
				name: String(row.name ?? 'Unknown agent'),
				new_sessions: Number(row.value ?? 0),
				new_articles: Number(article_row?.new_articles ?? 0),
				new_memory_posts: Number(article_row?.new_memory_posts ?? 0),
				new_wiki_posts: Number(article_row?.new_wiki_posts ?? 0)
			} satisfies ReportAgentChangeItem
		})
		.sort((left, right) => {
			const left_score =
				left.new_sessions * 3 + left.new_articles * 2 + left.new_memory_posts + left.new_wiki_posts
			const right_score =
				right.new_sessions * 3 + right.new_articles * 2 + right.new_memory_posts + right.new_wiki_posts

			return right_score - left_score
		})
		.filter(item => item.new_sessions > 0 || item.new_articles > 0)
		.slice(0, 6)
}

export const buildReportAnalytics = async (args: {
	period: ReportPeriod
	offset?: number
	now?: number
}): Promise<ReportAnalytics> => {
	const window = getReportWindow(args.period, args.offset ?? 0, args.now ?? Date.now())
	const { start_at, end_at } = window
	const usage = readUsageBreakdown(start_at, end_at)
	const conversation_limit_map: Record<ReportPeriod, number> = {
		day: 36,
		week: 96,
		month: 180,
		year: 240
	}
	const recent_posts = env.sqlite
		.prepare(
			`SELECT id, title, "for" AS target_for, updated_at
			FROM article
			WHERE updated_at >= ?
				AND updated_at < ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			ORDER BY updated_at DESC
			LIMIT 8`
		)
		.all(normalizeDbParam(start_at), normalizeDbParam(end_at)) as Array<Record<string, unknown>>
	const pending_links = countValue("SELECT COUNT(*) AS value FROM link WHERE status IN ('pending', 'none')")
	const ready_to_extract = countValue(
		`SELECT COUNT(*) AS value
		FROM link l
		LEFT JOIN link_article la ON la.link_id = l.id
		WHERE l.status = 'success'
			AND la.link_id IS NULL`
	)
	const backlog_pending =
		countValue(
			`SELECT COUNT(*) AS value
			FROM article
			WHERE is_pipelined = 0
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`
		) +
		countValue(
			`SELECT COUNT(*) AS value
			FROM article
			WHERE is_pipelined = 0
				AND "for" NOT IN ('user', 'wiki', 'memory')`
		) +
		countValue('SELECT COUNT(*) AS value FROM document WHERE is_pipelined = 0') +
		pending_links

	return {
		window,
		generated_at: Date.now(),
		usage: {
			message_count: countValue(
				'SELECT COUNT(*) AS value FROM message WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			user_message_count: countValue(
				"SELECT COUNT(*) AS value FROM message WHERE role = 'user' AND created_at >= ? AND created_at < ?",
				[start_at, end_at]
			),
			assistant_message_count: countValue(
				"SELECT COUNT(*) AS value FROM message WHERE role = 'assistant' AND created_at >= ? AND created_at < ?",
				[start_at, end_at]
			),
			total_tokens: usage.total_tokens,
			input_tokens: usage.input_tokens,
			output_tokens: usage.output_tokens,
			reasoning_tokens: usage.reasoning_tokens,
			cached_input_tokens: usage.cached_input_tokens,
			models: usage.models,
			providers: usage.providers
		},
		sessions: {
			new_sessions: countValue(
				'SELECT COUNT(*) AS value FROM session WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			active_sessions: countValue(
				`SELECT COUNT(DISTINCT session_id) AS value
				FROM message
				WHERE created_at >= ?
					AND created_at < ?`,
				[start_at, end_at]
			),
			im_sessions: countValue(
				'SELECT COUNT(*) AS value FROM session WHERE im = 1 AND created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			top_sessions: readTopSessions(start_at, end_at),
			top_im_sessions: readTopSessions(start_at, end_at, true),
			top_projects: readTopProjects(start_at, end_at)
		},
		content: {
			new_posts: countValue(
				`SELECT COUNT(*) AS value
				FROM article
				WHERE created_at >= ?
					AND created_at < ?
					AND "for" IN ('user', 'wiki', 'memory')
					AND ${organic_post_filter}`,
				[start_at, end_at]
			),
			new_user_posts: countValue(
				`SELECT COUNT(*) AS value
				FROM article
				WHERE created_at >= ?
					AND created_at < ?
					AND "for" = 'user'
					AND ${organic_post_filter}`,
				[start_at, end_at]
			),
			new_wiki_posts: countValue(
				`SELECT COUNT(*) AS value
				FROM article
				WHERE created_at >= ?
					AND created_at < ?
					AND "for" = 'wiki'
					AND ${organic_post_filter}`,
				[start_at, end_at]
			),
			new_memory_posts: countValue(
				`SELECT COUNT(*) AS value
				FROM article
				WHERE created_at >= ?
					AND created_at < ?
					AND "for" = 'memory'
					AND ${organic_post_filter}`,
				[start_at, end_at]
			),
			updated_posts: countValue(
				`SELECT COUNT(*) AS value
				FROM article
				WHERE updated_at >= ?
					AND updated_at < ?
					AND "for" IN ('user', 'wiki', 'memory')
					AND ${organic_post_filter}`,
				[start_at, end_at]
			),
			new_documents: countValue(
				'SELECT COUNT(*) AS value FROM document WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			recent_posts: recent_posts.map(row => ({
				id: String(row.id ?? ''),
				title: String(row.title ?? 'Untitled post'),
				for_type: String(row.target_for ?? ''),
				updated_at: Number(row.updated_at ?? 0)
			}))
		},
		knowledge: {
			new_nodes: countValue('SELECT COUNT(*) AS value FROM node WHERE created_at >= ? AND created_at < ?', [
				start_at,
				end_at
			]),
			total_nodes: countValue('SELECT COUNT(*) AS value FROM node'),
			new_edges: countValue('SELECT COUNT(*) AS value FROM edge WHERE created_at >= ? AND created_at < ?', [
				start_at,
				end_at
			]),
			total_edges: countValue('SELECT COUNT(*) AS value FROM edge'),
			rewire_events: countValue(
				'SELECT COUNT(*) AS value FROM rewire_event WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			active_edges: countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'active'"),
			silent_edges: countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'silent'"),
			unstable_edges: countValue(
				"SELECT COUNT(*) AS value FROM edge WHERE state = 'silent' OR stability < 0.3 OR rewire_score >= 0.5"
			),
			new_agent_articles: countValue(
				'SELECT COUNT(*) AS value FROM agent_article WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			top_agent_changes: readTopAgentChanges(start_at, end_at)
		},
		linkcase: {
			new_links: countValue('SELECT COUNT(*) AS value FROM link WHERE created_at >= ? AND created_at < ?', [
				start_at,
				end_at
			]),
			processed_links: countValue(
				'SELECT COUNT(DISTINCT link_id) AS value FROM link_article WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			failed_links: countValue(
				"SELECT COUNT(*) AS value FROM link WHERE status = 'fail' AND updated_at >= ? AND updated_at < ?",
				[start_at, end_at]
			),
			pending_links,
			ready_to_extract
		},
		ops: {
			new_notifications: countValue(
				'SELECT COUNT(*) AS value FROM notification WHERE created_at >= ? AND created_at < ?',
				[start_at, end_at]
			),
			unread_notifications: countValue('SELECT COUNT(*) AS value FROM notification WHERE is_read = 0'),
			im_peer_total: countValue('SELECT COUNT(*) AS value FROM im_peer_state'),
			backlog_pending
		},
		samples: {
			conversation: readConversationSamples(start_at, end_at, conversation_limit_map[args.period]),
			im: readConversationSamples(
				start_at,
				end_at,
				Math.max(16, Math.floor(conversation_limit_map[args.period] / 3)),
				true
			)
		}
	}
}
