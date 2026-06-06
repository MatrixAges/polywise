import { config } from '@core/config'
import { env } from '@core/env'

import type {
	PthinkAnalyticsSnapshot,
	PthinkConfig,
	PthinkReviewMessage,
	PthinkReviewWindow,
	PthinkRuntimeStatus,
	PthinkTriggerCandidate,
	PthinkWindowStats
} from './types'

const hour_ms = 60 * 60 * 1000
const day_ms = 24 * hour_ms
const week_ms = 7 * day_ms
const second_ms = 1000
const organic_post_where = `json_extract(metadata, '$.pthink.kind') IS NULL`

const normalizeDbParam = (value: unknown) =>
	typeof value === 'number' && Number.isFinite(value) && Math.abs(value) >= 1_000_000_000_000
		? Math.floor(value / second_ms)
		: value

const normalizeDbParams = (params: Array<unknown>) => params.map(normalizeDbParam)
const toUnixSeconds = (value: number) => Math.floor(value / second_ms)
const toUnixMilliseconds = (value: number) => (value > 1_000_000_000_000 ? value : value * second_ms)

const countValue = (query: string, params: Array<unknown> = []) => {
	const row = env.sqlite.prepare(query).get(...normalizeDbParams(params)) as { value?: number } | undefined

	return Number(row?.value ?? 0)
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

const getPendingPipelineItems = (
	stats: Pick<PthinkWindowStats, 'pending_posts' | 'pending_articles' | 'pending_documents' | 'pending_links'>
) => stats.pending_posts + stats.pending_articles + stats.pending_documents + stats.pending_links

const readWindowStats = (start_at: number): PthinkWindowStats => {
	const db_start_at = toUnixSeconds(start_at)
	const message_row = env.sqlite
		.prepare(
			`SELECT
				COUNT(*) AS messages,
				SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS user_messages,
				SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS assistant_messages,
				SUM(CASE WHEN role = 'assistant' THEN COALESCE(json_extract(content, '$.metadata.usage.inputTokens'), 0) ELSE 0 END) AS input_tokens,
				SUM(CASE WHEN role = 'assistant' THEN COALESCE(json_extract(content, '$.metadata.usage.outputTokens'), 0) ELSE 0 END) AS output_tokens,
				SUM(CASE WHEN role = 'assistant' THEN COALESCE(json_extract(content, '$.metadata.usage.totalTokens'), 0) ELSE 0 END) AS total_tokens,
				SUM(CASE WHEN role = 'assistant' THEN COALESCE(json_extract(content, '$.metadata.usage.reasoningTokens'), 0) ELSE 0 END) AS reasoning_tokens,
				SUM(CASE WHEN role = 'assistant' THEN COALESCE(json_extract(content, '$.metadata.usage.cachedInputTokens'), 0) ELSE 0 END) AS cached_input_tokens
			FROM message
			WHERE created_at >= ?`
		)
		.get(db_start_at) as Record<string, number | null>

	return {
		sessions: countValue('SELECT COUNT(*) AS value FROM session WHERE created_at >= ?', [db_start_at]),
		messages: Number(message_row.messages ?? 0),
		user_messages: Number(message_row.user_messages ?? 0),
		assistant_messages: Number(message_row.assistant_messages ?? 0),
		input_tokens: Number(message_row.input_tokens ?? 0),
		output_tokens: Number(message_row.output_tokens ?? 0),
		total_tokens: Number(message_row.total_tokens ?? 0),
		reasoning_tokens: Number(message_row.reasoning_tokens ?? 0),
		cached_input_tokens: Number(message_row.cached_input_tokens ?? 0),
		new_posts: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_where}`,
			[db_start_at]
		),
		new_memory_posts: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE created_at >= ?
				AND "for" = 'memory'
				AND ${organic_post_where}`,
			[db_start_at]
		),
		updated_posts: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE updated_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_where}`,
			[db_start_at]
		),
		new_documents: countValue('SELECT COUNT(*) AS value FROM document WHERE created_at >= ?', [db_start_at]),
		rewire_events: countValue('SELECT COUNT(*) AS value FROM rewire_event WHERE created_at >= ?', [
			db_start_at
		]),
		new_notifications: countValue('SELECT COUNT(*) AS value FROM notification WHERE created_at >= ?', [
			db_start_at
		]),
		unread_notifications: countValue('SELECT COUNT(*) AS value FROM notification WHERE is_read = 0'),
		pending_posts: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE is_pipelined = 0
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_where}`
		),
		pending_articles: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE is_pipelined = 0
				AND "for" NOT IN ('user', 'wiki', 'memory')`
		),
		pending_documents: countValue('SELECT COUNT(*) AS value FROM document WHERE is_pipelined = 0'),
		pending_links: countValue("SELECT COUNT(*) AS value FROM link WHERE status IN ('pending', 'none')")
	}
}

const readTopModels = (start_at: number) => {
	const db_start_at = toUnixSeconds(start_at)
	const assistant_messages = env.sqlite
		.prepare(
			`SELECT
				session_id,
				created_at,
				json_extract(content, '$.metadata.sender_id') AS sender_id,
				json_extract(content, '$.metadata.usage.totalTokens') AS total_tokens
			FROM message
			WHERE role = 'assistant'
				AND created_at >= ?
				AND json_extract(content, '$.metadata.usage.totalTokens') IS NOT NULL`
		)
		.all(db_start_at) as Array<{
		session_id: string
		created_at: number
		sender_id: string | null
		total_tokens: number | null
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

	const totals = new Map<string, { key: string; label: string; calls: number; total_tokens: number }>()

	for (const row of assistant_messages) {
		const model_config =
			(row.sender_id ? agent_model_map.get(row.sender_id) : null) ||
			session_agent_map.get(row.session_id) ||
			session_project_map.get(row.session_id) ||
			config.default_model
		const key = getModelKey(model_config)
		const item = totals.get(key) ?? {
			key,
			label: formatModelName(model_config),
			calls: 0,
			total_tokens: 0
		}

		item.calls += 1
		item.total_tokens += Number(row.total_tokens ?? 0)
		totals.set(key, item)
	}

	return Array.from(totals.values())
		.sort((a, b) => b.total_tokens - a.total_tokens)
		.slice(0, 5)
}

const noise_patterns = [
	/Called the [A-Za-z]+ tool with the following input:/gi,
	/<system-reminder>[\s\S]*?<\/system-reminder>/gi,
	/<content>[\s\S]*?<\/content>/gi,
	/<path>[\s\S]*?<\/path>/gi,
	/<type>[\s\S]*?<\/type>/gi,
	/Plan Mode/gi,
	/STRICTLY FORBIDDEN/gi,
	/\(End of file - total \d+ lines\)/gi
] as Array<RegExp>

const stripNoise = (value: string) => {
	return noise_patterns.reduce((target, pattern) => target.replace(pattern, ' '), value).trim()
}

const extractText = (content: string) => {
	try {
		const parsed = JSON.parse(content) as {
			content?: string
			parts?: Array<{
				type?: string
				text?: string
			}>
		}

		if (Array.isArray(parsed.parts)) {
			const text = parsed.parts
				.map(part => (part?.type === 'text' ? String(part.text || '') : ''))
				.filter(Boolean)
				.join('\n')

			return stripNoise(text).replace(/\s+/g, ' ').trim()
		}

		if (typeof parsed.content === 'string') {
			return stripNoise(parsed.content).replace(/\s+/g, ' ').trim()
		}
	} catch {
		return stripNoise(content).replace(/\s+/g, ' ').trim()
	}

	return ''
}

export const getPthinkWindowStart = (status: PthinkRuntimeStatus, now = Date.now()) => {
	const day_start = new Date(now)
	day_start.setHours(0, 0, 0, 0)

	return Math.max(day_start.getTime(), Number(status.last_review_at ?? 0) || Number(status.boot_at ?? now))
}

export const readPthinkReviewWindow = (args: {
	status: PthinkRuntimeStatus
	config: PthinkConfig
	now?: number
}): PthinkReviewWindow => {
	const now = args.now ?? Date.now()
	const start_at = getPthinkWindowStart(args.status, now)
	const rows = env.sqlite
		.prepare(
			`SELECT
				m.id AS id,
				m.session_id AS session_id,
				s.title AS session_title,
				ps.project_id AS project_id,
				ags.agent_id AS agent_id,
				m.role AS role,
				m.content AS content,
				m.created_at AS created_at
			FROM message m
			INNER JOIN session s ON s.id = m.session_id
			LEFT JOIN project_session ps ON ps.session_id = m.session_id
			LEFT JOIN agent_session ags ON ags.session_id = m.session_id
			WHERE m.created_at >= ? AND m.created_at <= ?
			ORDER BY m.created_at ASC`
		)
		.all(toUnixSeconds(start_at), toUnixSeconds(now)) as Array<{
		id: string
		session_id: string
		session_title: string | null
		project_id: string | null
		agent_id: string | null
		role: string
		content: string
		created_at: number
	}>

	const session_map = new Map<
		string,
		{
			id: string
			title: string
			scope_type: 'global' | 'agent' | 'project'
			scope_id: string | null
		}
	>()
	const messages = rows
		.map(row => {
			const text = extractText(row.content)
			const session_scope_type = row.project_id ? 'project' : row.agent_id ? 'agent' : 'global'
			const session_scope_id = row.project_id ?? row.agent_id ?? null

			session_map.set(row.session_id, {
				id: row.session_id,
				title: String(row.session_title ?? ''),
				scope_type: session_scope_type,
				scope_id: session_scope_id
			})

			return {
				id: row.id,
				session_id: row.session_id,
				session_title: String(row.session_title ?? ''),
				session_scope_type,
				session_scope_id,
				role: row.role,
				text: text.length > 1200 ? `${text.slice(0, 1200)}...` : text,
				created_at: toUnixMilliseconds(Number(row.created_at ?? 0))
			} satisfies PthinkReviewMessage
		})
		.filter(item => item.text)

	const trimmed_messages =
		messages.length > args.config.max_messages
			? messages.slice(messages.length - args.config.max_messages)
			: messages
	const session_count = new Set(trimmed_messages.map(item => item.session_id)).size

	return {
		start_at,
		end_at: now,
		message_count: trimmed_messages.length,
		session_count,
		sessions: Array.from(session_map.values()).filter(session_item =>
			trimmed_messages.some(message_item => message_item.session_id === session_item.id)
		),
		messages: trimmed_messages
	}
}

export const hasMeaningfulRecentActivity = (analytics: PthinkAnalyticsSnapshot) => {
	const day = analytics.windows.day

	return (
		day.messages >= 20 ||
		day.total_tokens >= 6000 ||
		day.new_posts >= 1 ||
		day.rewire_events >= 10 ||
		day.new_notifications >= 4
	)
}

export const hasReviewableMessages = (window: PthinkReviewWindow, config: PthinkConfig) => {
	return window.message_count >= config.min_messages
}

export const pickPthinkTrigger = (args: {
	analytics: PthinkAnalyticsSnapshot
	status: PthinkRuntimeStatus
	now?: number
	trigger_cooldown_ms: number
}) => {
	const now = args.now ?? Date.now()
	const window = readPthinkReviewWindow({
		status: args.status,
		config: {
			enabled: true,
			idle_grace_ms: 0,
			review_cooldown_ms: args.trigger_cooldown_ms,
			min_messages: 1,
			max_messages: 200,
			max_articles_per_run: 4,
			skill_generation_enabled: true,
			tool_generation_enabled: true,
			monitor_ms: 60_000
		},
		now
	})
	const recent = args.analytics.windows.six_hours
	const candidates = [] as Array<PthinkTriggerCandidate>

	if (window.message_count >= 12) {
		candidates.push({
			key: 'review_backlog',
			label: 'Review backlog',
			detail: `${window.message_count} unreviewed messages across ${window.session_count} sessions today`,
			score: window.message_count * 100 + window.session_count * 500
		})
	}

	if (recent.total_tokens >= 20_000 || recent.assistant_messages >= 18) {
		candidates.push({
			key: 'dense_reasoning',
			label: 'Dense reasoning burst',
			detail: `${recent.assistant_messages} assistant replies and ${recent.total_tokens} tokens in the last 6 hours`,
			score: recent.total_tokens + recent.assistant_messages * 500
		})
	}

	if (!candidates.length) {
		return null
	}

	return candidates.sort((a, b) => b.score - a.score)[0] ?? null
}

export const buildPthinkAnalytics = (now = Date.now()): PthinkAnalyticsSnapshot => {
	const day_start = now - day_ms
	const week_start = now - week_ms
	const six_hour_start = now - 6 * hour_ms
	const db_week_start = toUnixSeconds(week_start)

	const active_sessions = env.sqlite
		.prepare(
			`SELECT
				s.id AS id,
				s.title AS title,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_message_at
			FROM session s
			INNER JOIN message m ON m.session_id = s.id
			WHERE m.created_at >= ?
			GROUP BY s.id, s.title
			ORDER BY message_count DESC, last_message_at DESC
			LIMIT 5`
		)
		.all(db_week_start)
		.map(row => {
			const item = row as Record<string, unknown>

			return {
				id: String(item.id ?? ''),
				title: String(item.title ?? ''),
				message_count: Number(item.message_count ?? 0),
				last_message_at: Number(item.last_message_at ?? 0)
			}
		})

	const active_projects = env.sqlite
		.prepare(
			`SELECT
				p.id AS id,
				p.name AS name,
				COUNT(DISTINCT ps.session_id) AS session_count,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_message_at
			FROM project p
			INNER JOIN project_session ps ON ps.project_id = p.id
			LEFT JOIN message m ON m.session_id = ps.session_id AND m.created_at >= ?
			GROUP BY p.id, p.name
			HAVING session_count > 0
			ORDER BY message_count DESC, last_message_at DESC
			LIMIT 5`
		)
		.all(db_week_start)
		.map(row => {
			const item = row as Record<string, unknown>

			return {
				id: String(item.id ?? ''),
				name: String(item.name ?? ''),
				session_count: Number(item.session_count ?? 0),
				message_count: Number(item.message_count ?? 0),
				last_message_at: Number(item.last_message_at ?? 0)
			}
		})

	const recent_posts = env.sqlite
		.prepare(
			`SELECT id, title, "for" AS target_for, updated_at
				FROM article
				WHERE "for" IN ('user', 'wiki', 'memory')
					AND ${organic_post_where}
				ORDER BY updated_at DESC
				LIMIT 5`
		)
		.all()
		.map(row => {
			const item = row as Record<string, unknown>

			return {
				id: String(item.id ?? ''),
				title: String(item.title ?? ''),
				for_type: String(item.target_for ?? ''),
				updated_at: Number(item.updated_at ?? 0)
			}
		})

	return {
		generated_at: now,
		windows: {
			six_hours: readWindowStats(six_hour_start),
			day: readWindowStats(day_start),
			week: readWindowStats(week_start)
		},
		totals: {
			sessions: countValue('SELECT COUNT(*) AS value FROM session'),
			messages: countValue('SELECT COUNT(*) AS value FROM message'),
			posts: countValue(
				`SELECT COUNT(*) AS value FROM article WHERE "for" IN ('user', 'wiki', 'memory') AND ${organic_post_where}`
			),
			documents: countValue('SELECT COUNT(*) AS value FROM document'),
			projects: countValue('SELECT COUNT(*) AS value FROM project'),
			agents: countValue('SELECT COUNT(*) AS value FROM agent'),
			nodes: countValue('SELECT COUNT(*) AS value FROM node'),
			edges: countValue('SELECT COUNT(*) AS value FROM edge')
		},
		top_models: readTopModels(week_start),
		active_sessions,
		active_projects,
		recent_posts
	}
}
