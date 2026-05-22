import { config } from '@core/config'
import { env } from '@core/env'

import type { PthinkAnalyticsSnapshot, PthinkRuntimeStatus, PthinkTriggerCandidate, PthinkWindowStats } from './types'

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

export const pickPthinkTrigger = (args: {
	analytics: PthinkAnalyticsSnapshot
	status: PthinkRuntimeStatus
	now?: number
	trigger_cooldown_ms: number
}) => {
	const now = args.now ?? Date.now()
	const { analytics, status, trigger_cooldown_ms } = args
	const candidates = [] as Array<PthinkTriggerCandidate>
	const recent = analytics.windows.six_hours
	const day = analytics.windows.day
	const pending_pipeline_items = getPendingPipelineItems(day)

	if (recent.total_tokens >= 20_000 || recent.assistant_messages >= 18) {
		candidates.push({
			key: 'ai_usage_spike',
			label: 'AI usage spike',
			detail: `${recent.assistant_messages} assistant replies and ${recent.total_tokens} tokens in the last 6 hours`,
			score: recent.total_tokens + recent.assistant_messages * 500
		})
	}

	if (recent.sessions >= 4 || recent.messages >= 60) {
		candidates.push({
			key: 'session_burst',
			label: 'Session burst',
			detail: `${recent.sessions} new sessions and ${recent.messages} messages in the last 6 hours`,
			score: recent.messages * 100 + recent.sessions * 1500
		})
	}

	if (day.new_posts + day.new_memory_posts >= 3 || day.rewire_events >= 25) {
		candidates.push({
			key: 'knowledge_growth',
			label: 'Knowledge growth',
			detail: `${day.new_posts} new posts and ${day.rewire_events} rewire events in the last 24 hours`,
			score: day.new_posts * 5000 + day.rewire_events * 120
		})
	}

	if (pending_pipeline_items >= 5 || day.unread_notifications >= 6) {
		candidates.push({
			key: 'backlog_pressure',
			label: 'Backlog pressure',
			detail: `${pending_pipeline_items} pending pipeline items, ${day.unread_notifications} unread notifications`,
			score: pending_pipeline_items * 2500 + day.unread_notifications * 400
		})
	}

	return (
		candidates
			.filter(candidate => {
				const last_fired = Number(status.trigger_last_fired[candidate.key] ?? 0)

				return !last_fired || now - last_fired >= trigger_cooldown_ms
			})
			.sort((a, b) => b.score - a.score)[0] ?? null
	)
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
