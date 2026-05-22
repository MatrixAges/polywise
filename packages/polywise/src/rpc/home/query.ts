import { config } from '@core/config'
import { buildPthinkAnalytics, getPthinkConfig, pickPthinkTrigger, readPthinkStatus } from '@core/pthink'
import { p } from '@core/utils'

import { env } from '../../env'

const week_ms = 7 * 24 * 60 * 60 * 1000
const day_ms = 24 * 60 * 60 * 1000
const trend_days = 14
const organic_post_filter = `json_extract(metadata, '$.pthink.kind') IS NULL`

const countValue = (query: string, params: Array<unknown> = []) => {
	const row = env.sqlite.prepare(query).get(...params) as { value?: number } | undefined

	return Number(row?.value ?? 0)
}

const round = (value: number, digits = 1) => {
	const factor = 10 ** digits

	return Math.round(value * factor) / factor
}

const getDayKey = (value: number) => {
	const date = new Date(value)
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')

	return `${year}-${month}-${day}`
}

const getDayLabel = (value: number) => {
	const date = new Date(value)

	return `${date.getMonth() + 1}/${date.getDate()}`
}

const getDayStart = (value: number) => {
	const date = new Date(value)

	date.setHours(0, 0, 0, 0)

	return date.getTime()
}

const getDateFromDayKey = (value: string) => {
	const [year, month, day] = value.split('-').map(Number)

	return new Date(year, (month || 1) - 1, day || 1)
}

const dayDiff = (left: string, right: string) => {
	return Math.round((getDateFromDayKey(left).getTime() - getDateFromDayKey(right).getTime()) / day_ms)
}

const readPostForCounts = () => {
	const rows = env.sqlite
		.prepare(
			`SELECT "for" AS target_for, COUNT(*) AS value
			FROM article
			WHERE "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			GROUP BY "for"`
		)
		.all() as Array<{ target_for: string | null; value: number }>

	const counts = {
		user: 0,
		wiki: 0,
		memory: 0
	}

	for (const row of rows) {
		if (row.target_for === 'user' || row.target_for === 'wiki' || row.target_for === 'memory') {
			counts[row.target_for] = Number(row.value ?? 0)
		}
	}

	return counts
}

const readOrganicPostStreak = (today_key: string) => {
	const rows = env.sqlite
		.prepare(
			`SELECT DISTINCT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key
			FROM article
			WHERE "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			ORDER BY day_key DESC`
		)
		.all() as Array<{ day_key: string | null }>

	const day_keys = rows.map(row => row.day_key).filter((item): item is string => Boolean(item))

	if (day_keys[0] !== today_key) {
		return 0
	}

	let streak = 1

	for (let index = 1; index < day_keys.length; index += 1) {
		if (dayDiff(day_keys[index - 1]!, day_keys[index]!) !== 1) {
			break
		}

		streak += 1
	}

	return streak
}

const toBoolean = (value: unknown) => Boolean(value)

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

const buildUsageAnalytics = (last_week: number) => {
	const assistant_messages = env.sqlite
		.prepare(
			`SELECT
				session_id,
				created_at,
				json_extract(content, '$.metadata.sender_id') AS sender_id,
				json_extract(content, '$.metadata.usage.inputTokens') AS input_tokens,
				json_extract(content, '$.metadata.usage.outputTokens') AS output_tokens,
				json_extract(content, '$.metadata.usage.totalTokens') AS total_tokens,
				json_extract(content, '$.metadata.usage.reasoningTokens') AS reasoning_tokens,
				json_extract(content, '$.metadata.usage.cachedInputTokens') AS cached_input_tokens
			FROM message
			WHERE role = 'assistant'
				AND json_extract(content, '$.metadata.usage.totalTokens') IS NOT NULL`
		)
		.all() as Array<{
		session_id: string
		created_at: number
		sender_id: string | null
		input_tokens: number | null
		output_tokens: number | null
		total_tokens: number | null
		reasoning_tokens: number | null
		cached_input_tokens: number | null
	}>

	const agent_rows = env.sqlite.prepare('SELECT id, name, model FROM agent').all() as Array<{
		id: string
		name: string
		model: string | null
	}>
	const agent_model_map = new Map(
		agent_rows.map(item => [
			item.id,
			{
				name: item.name,
				model: parseModelConfig(item.model)
			}
		])
	)

	const session_agent_rows = env.sqlite
		.prepare(
			`SELECT
				ag.session_id AS session_id,
				a.name AS agent_name,
				a.model AS agent_model
			FROM agent_session ag
			INNER JOIN agent a ON ag.agent_id = a.id`
		)
		.all() as Array<{ session_id: string; agent_name: string; agent_model: string | null }>
	const session_agent_map = new Map(
		session_agent_rows.map(item => [
			item.session_id,
			{
				name: item.agent_name,
				model: parseModelConfig(item.agent_model)
			}
		])
	)

	const session_project_rows = env.sqlite
		.prepare(
			`SELECT
				ps.session_id AS session_id,
				p.name AS project_name,
				p.model AS project_model
			FROM project_session ps
			INNER JOIN project p ON ps.project_id = p.id`
		)
		.all() as Array<{ session_id: string; project_name: string; project_model: string | null }>
	const session_project_map = new Map(
		session_project_rows.map(item => [
			item.session_id,
			{
				name: item.project_name,
				model: parseModelConfig(item.project_model)
			}
		])
	)

	const default_model = config.default_model
	const default_model_key = getModelKey(default_model)
	const provider_totals = new Map<string, { provider: string; calls: number; total_tokens: number }>()
	const model_totals = new Map<
		string,
		{
			key: string
			provider: string
			model: string
			label: string
			source: string
			calls: number
			total_tokens: number
			input_tokens: number
			output_tokens: number
			reasoning_tokens: number
		}
	>()

	const totals = {
		assistant_messages: 0,
		input_tokens: 0,
		output_tokens: 0,
		total_tokens: 0,
		reasoning_tokens: 0,
		cached_input_tokens: 0,
		week_total_tokens: 0
	}

	for (const row of assistant_messages) {
		const input_tokens = Number(row.input_tokens ?? 0)
		const output_tokens = Number(row.output_tokens ?? 0)
		const total_tokens = Number(row.total_tokens ?? input_tokens + output_tokens)
		const reasoning_tokens = Number(row.reasoning_tokens ?? 0)
		const cached_input_tokens = Number(row.cached_input_tokens ?? 0)

		totals.assistant_messages += 1
		totals.input_tokens += input_tokens
		totals.output_tokens += output_tokens
		totals.total_tokens += total_tokens
		totals.reasoning_tokens += reasoning_tokens
		totals.cached_input_tokens += cached_input_tokens

		if (Number(row.created_at ?? 0) >= last_week) {
			totals.week_total_tokens += total_tokens
		}

		const sender_agent = row.sender_id ? agent_model_map.get(row.sender_id) : null
		const owner_agent = session_agent_map.get(row.session_id)
		const project_model = session_project_map.get(row.session_id)
		const model_config = sender_agent?.model || owner_agent?.model || project_model?.model || default_model
		const model_key = getModelKey(model_config) || default_model_key
		const provider = model_config?.provider || default_model.provider
		const model = model_config?.model || default_model.model
		const label = formatModelName(model_config || default_model)
		const source = sender_agent
			? `sender:${sender_agent.name}`
			: owner_agent
				? `agent:${owner_agent.name}`
				: project_model
					? `project:${project_model.name}`
					: 'default'

		const provider_entry = provider_totals.get(provider) ?? {
			provider,
			calls: 0,
			total_tokens: 0
		}
		provider_entry.calls += 1
		provider_entry.total_tokens += total_tokens
		provider_totals.set(provider, provider_entry)

		const model_entry = model_totals.get(model_key) ?? {
			key: model_key,
			provider,
			model,
			label,
			source,
			calls: 0,
			total_tokens: 0,
			input_tokens: 0,
			output_tokens: 0,
			reasoning_tokens: 0
		}
		model_entry.calls += 1
		model_entry.total_tokens += total_tokens
		model_entry.input_tokens += input_tokens
		model_entry.output_tokens += output_tokens
		model_entry.reasoning_tokens += reasoning_tokens
		model_totals.set(model_key, model_entry)
	}

	return {
		...totals,
		avg_total_tokens_per_reply:
			totals.assistant_messages > 0
				? Number((totals.total_tokens / totals.assistant_messages).toFixed(1))
				: 0,
		providers: Array.from(provider_totals.values()).sort((a, b) => b.total_tokens - a.total_tokens),
		models: Array.from(model_totals.values())
			.sort((a, b) => b.total_tokens - a.total_tokens)
			.slice(0, 8)
	}
}

const buildDailyTrendRows = (now: number) => {
	const start_at = getDayStart(now - (trend_days - 1) * day_ms)
	const buckets = Array.from({ length: trend_days }, (_, index) => {
		const ts = start_at + index * day_ms

		return {
			date: getDayKey(ts),
			label: getDayLabel(ts),
			timestamp: ts,
			input_tokens: 0,
			output_tokens: 0,
			reasoning_tokens: 0,
			total_tokens: 0,
			assistant_messages: 0,
			messages: 0,
			new_sessions: 0,
			new_posts: 0,
			new_documents: 0,
			rewire_events: 0,
			pthink_reports: 0,
			notifications: 0
		}
	})
	const bucket_map = new Map(buckets.map(item => [item.date, item]))

	const usage_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS assistant_messages,
				SUM(COALESCE(json_extract(content, '$.metadata.usage.inputTokens'), 0)) AS input_tokens,
				SUM(COALESCE(json_extract(content, '$.metadata.usage.outputTokens'), 0)) AS output_tokens,
				SUM(COALESCE(json_extract(content, '$.metadata.usage.reasoningTokens'), 0)) AS reasoning_tokens,
				SUM(COALESCE(json_extract(content, '$.metadata.usage.totalTokens'), 0)) AS total_tokens
			FROM message
			WHERE role = 'assistant'
				AND created_at >= ?
				AND json_extract(content, '$.metadata.usage.totalTokens') IS NOT NULL
			GROUP BY day_key`
		)
		.all(start_at) as Array<{
		day_key: string | null
		assistant_messages: number | null
		input_tokens: number | null
		output_tokens: number | null
		reasoning_tokens: number | null
		total_tokens: number | null
	}>

	for (const row of usage_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (!target) {
			continue
		}

		target.assistant_messages = Number(row.assistant_messages ?? 0)
		target.input_tokens = Number(row.input_tokens ?? 0)
		target.output_tokens = Number(row.output_tokens ?? 0)
		target.reasoning_tokens = Number(row.reasoning_tokens ?? 0)
		target.total_tokens = Number(row.total_tokens ?? 0)
	}

	const message_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM message
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of message_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.messages = Number(row.value ?? 0)
		}
	}

	const session_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM session
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of session_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.new_sessions = Number(row.value ?? 0)
		}
	}

	const post_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of post_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.new_posts = Number(row.value ?? 0)
		}
	}

	const document_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM document
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of document_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.new_documents = Number(row.value ?? 0)
		}
	}

	const rewire_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM rewire_event
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of rewire_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.rewire_events = Number(row.value ?? 0)
		}
	}

	const pthink_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of pthink_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.pthink_reports = Number(row.value ?? 0)
		}
	}

	const notification_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM notification
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of notification_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.notifications = Number(row.value ?? 0)
		}
	}

	return buckets
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/home/query',
			summary: 'Read Query'
		}
	})
	.query(async () => {
		const now = Date.now()
		const last_day = now - day_ms
		const last_three_days = now - 3 * day_ms
		const last_week = now - week_ms
		const today_key = getDayKey(now)
		const pthink_config = getPthinkConfig()
		const usage = buildUsageAnalytics(last_week)
		const trends = buildDailyTrendRows(now)
		const pthink_analytics = buildPthinkAnalytics(now)
		const pthink_status = await readPthinkStatus()
		const top_alert = pthink_config.trigger_enabled
			? pickPthinkTrigger({
					analytics: pthink_analytics,
					status: pthink_status,
					now,
					trigger_cooldown_ms: pthink_config.trigger_cooldown_ms
				})
			: null

		const session_total = countValue('SELECT COUNT(*) AS value FROM session')
		const message_total = countValue('SELECT COUNT(*) AS value FROM message')
		const article_total = countValue('SELECT COUNT(*) AS value FROM article')
		const chunk_total = countValue('SELECT COUNT(*) AS value FROM chunk')
		const document_total = countValue('SELECT COUNT(*) AS value FROM document')
		const link_total = countValue('SELECT COUNT(*) AS value FROM link')
		const agent_total = countValue('SELECT COUNT(*) AS value FROM agent')
		const group_total = countValue('SELECT COUNT(*) AS value FROM "group"')
		const project_total = countValue('SELECT COUNT(*) AS value FROM project')
		const skill_total = countValue('SELECT COUNT(*) AS value FROM skill')
		const notification_total = countValue('SELECT COUNT(*) AS value FROM notification')
		const notification_unread = countValue('SELECT COUNT(*) AS value FROM notification WHERE is_read = 0')
		const notification_pushed = countValue('SELECT COUNT(*) AS value FROM notification WHERE is_pushed = 1')
		const notification_unpushed = countValue('SELECT COUNT(*) AS value FROM notification WHERE is_pushed = 0')
		const im_account_total = countValue('SELECT COUNT(*) AS value FROM im_account')
		const im_account_enabled = countValue('SELECT COUNT(*) AS value FROM im_account WHERE enabled = 1')
		const im_peer_total = countValue('SELECT COUNT(*) AS value FROM im_peer_state')
		const node_total = countValue('SELECT COUNT(*) AS value FROM node')
		const frozen_node_total = countValue('SELECT COUNT(*) AS value FROM node WHERE is_frozen = 1')
		const node_week_total = countValue('SELECT COUNT(*) AS value FROM node WHERE created_at >= ?', [last_week])
		const edge_total = countValue('SELECT COUNT(*) AS value FROM edge')
		const frozen_edge_total = countValue('SELECT COUNT(*) AS value FROM edge WHERE is_frozen = 1')
		const edge_week_total = countValue('SELECT COUNT(*) AS value FROM edge WHERE created_at >= ?', [last_week])
		const active_edge_total = countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'active'")
		const silent_edge_total = countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'silent'")
		const unstable_edge_total = countValue(
			"SELECT COUNT(*) AS value FROM edge WHERE state = 'silent' OR stability < 0.3 OR rewire_score >= 0.5"
		)
		const rewire_event_total = countValue('SELECT COUNT(*) AS value FROM rewire_event')
		const rewire_event_week = countValue('SELECT COUNT(*) AS value FROM rewire_event WHERE created_at >= ?', [
			last_week
		])
		const edge_stats_row = env.sqlite
			.prepare(
				`SELECT
					AVG(stability) AS avg_stability,
					AVG(rewire_score) AS avg_rewire_score
				FROM edge`
			)
			.get() as { avg_stability?: number | null; avg_rewire_score?: number | null } | undefined

		const sessions_running = countValue('SELECT COUNT(*) AS value FROM session WHERE runing = 1')
		const sessions_unread = countValue('SELECT COUNT(*) AS value FROM session WHERE unread = 1')
		const sessions_im = countValue('SELECT COUNT(*) AS value FROM session WHERE im = 1')
		const sessions_cron = countValue('SELECT COUNT(*) AS value FROM session WHERE cron = 1')
		const sessions_today = countValue('SELECT COUNT(*) AS value FROM session WHERE created_at >= ?', [last_day])
		const sessions_week = countValue('SELECT COUNT(*) AS value FROM session WHERE created_at >= ?', [last_week])
		const sessions_with_messages_week = countValue(
			'SELECT COUNT(DISTINCT session_id) AS value FROM message WHERE created_at >= ?',
			[last_week]
		)
		const stale_unread_sessions_24h = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			[last_day]
		)
		const stale_unread_sessions_72h = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			[last_three_days]
		)
		const sessions_without_followup_week = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			[last_week]
		)
		const idle_sessions_week = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE runing = 0 AND updated_at < ?',
			[last_week]
		)
		const messages_today = countValue('SELECT COUNT(*) AS value FROM message WHERE created_at >= ?', [last_day])
		const messages_week = countValue('SELECT COUNT(*) AS value FROM message WHERE created_at >= ?', [last_week])

		const documents_pending = countValue('SELECT COUNT(*) AS value FROM document WHERE is_pipelined = 0')
		const articles_pending = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE is_pipelined = 0 AND \"for\" NOT IN ('user', 'wiki', 'memory')"
		)
		const posts_pending = countValue(
			`SELECT COUNT(*) AS value FROM article
		WHERE is_pipelined = 0
			AND "for" IN ('user', 'wiki', 'memory')
			AND ${organic_post_filter}`
		)
		const long_article_total = countValue('SELECT COUNT(*) AS value FROM article WHERE is_long = 1')
		const link_ready_total = countValue("SELECT COUNT(*) AS value FROM link WHERE status = 'success'")
		const link_pending_total = countValue(
			"SELECT COUNT(*) AS value FROM link WHERE status IN ('pending', 'none')"
		)
		const link_fail_total = countValue("SELECT COUNT(*) AS value FROM link WHERE status = 'fail'")

		const post_for_counts = readPostForCounts()
		const post_total = post_for_counts.user + post_for_counts.wiki + post_for_counts.memory
		const posts_ready_total = Math.max(0, post_total - posts_pending)
		const posts_today = countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`,
			[last_day]
		)
		const posts_week = countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`,
			[last_week]
		)
		const last_post_at_row = env.sqlite
			.prepare(
				`SELECT MAX(updated_at) AS value
				FROM article
				WHERE "for" IN ('user', 'wiki', 'memory')
					AND ${organic_post_filter}`
			)
			.get() as { value?: number | null } | undefined
		const last_post_at = Number(last_post_at_row?.value ?? 0)
		const days_since_last_post = last_post_at ? Math.floor((now - last_post_at) / day_ms) : null
		const post_streak_days = readOrganicPostStreak(today_key)
		const backlog_pending_total = documents_pending + articles_pending + posts_pending + link_pending_total
		const backlog_pressure_score =
			backlog_pending_total * 10 +
			notification_unread * 4 +
			stale_unread_sessions_24h * 6 +
			link_fail_total * 8
		const total_project_messages = pthink_analytics.active_projects.reduce(
			(acc, item) => acc + item.message_count,
			0
		)
		const project_focus_concentration =
			total_project_messages > 0 && pthink_analytics.active_projects[0]
				? round((pthink_analytics.active_projects[0].message_count / total_project_messages) * 100)
				: 0
		const recent_sessions = env.sqlite
			.prepare(
				'SELECT id, title, runing, unread, im, cron, updated_at FROM session ORDER BY updated_at DESC LIMIT 6'
			)
			.all()
			.map(row => {
				const target = row as Record<string, unknown>

				return {
					id: String(target.id ?? ''),
					title: String(target.title ?? ''),
					is_runing: toBoolean(target.runing),
					unread: toBoolean(target.unread),
					is_im: toBoolean(target.im),
					is_cron: toBoolean(target.cron),
					updated_at: Number(target.updated_at ?? 0)
				}
			})

		const recent_posts = env.sqlite
			.prepare(
				`SELECT id, title, "for" AS target_for, is_pipelined, updated_at
			FROM article
			WHERE "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			ORDER BY updated_at DESC
			LIMIT 6`
			)
			.all()
			.map(row => {
				const target = row as Record<string, unknown>

				return {
					id: String(target.id ?? ''),
					title: String(target.title ?? ''),
					for_type: String(target.target_for ?? ''),
					is_pipelined: toBoolean(target.is_pipelined),
					updated_at: Number(target.updated_at ?? 0)
				}
			})

		const recent_notifications = env.sqlite
			.prepare('SELECT id, title, is_read, created_at FROM notification ORDER BY created_at DESC LIMIT 5')
			.all()
			.map(row => {
				const target = row as Record<string, unknown>

				return {
					id: String(target.id ?? ''),
					title: String(target.title ?? ''),
					is_read: toBoolean(target.is_read),
					created_at: Number(target.created_at ?? 0)
				}
			})

		const recent_pthink_reports = env.sqlite
			.prepare(
				`SELECT
				id,
				title,
				created_at,
				json_extract(metadata, '$.pthink.kind') AS pthink_kind,
				json_extract(metadata, '$.pthink.trigger_key') AS trigger_key
			FROM article
			WHERE "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
			ORDER BY created_at DESC
			LIMIT 5`
			)
			.all()
			.map(row => {
				const target = row as Record<string, unknown>

				return {
					id: String(target.id ?? ''),
					title: String(target.title ?? ''),
					kind: String(target.pthink_kind ?? ''),
					trigger_key: target.trigger_key ? String(target.trigger_key) : null,
					created_at: Number(target.created_at ?? 0)
				}
			})

		const pthink_report_total = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE \"for\" = 'memory' AND json_extract(metadata, '$.pthink.kind') IS NOT NULL"
		)
		const pthink_report_week = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE \"for\" = 'memory' AND json_extract(metadata, '$.pthink.kind') IS NOT NULL AND created_at >= ?",
			[last_week]
		)
		const pthink_report_today = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE \"for\" = 'memory' AND json_extract(metadata, '$.pthink.kind') IS NOT NULL AND created_at >= ?",
			[now - 24 * 60 * 60 * 1000]
		)

		return {
			overview: {
				session_total,
				sessions_running,
				sessions_unread,
				sessions_im,
				sessions_cron,
				sessions_today,
				sessions_week,
				sessions_with_messages_week,
				stale_unread_sessions_24h,
				stale_unread_sessions_72h,
				sessions_without_followup_week,
				idle_sessions_week,
				message_total,
				messages_today,
				messages_week,
				avg_messages_per_session:
					session_total > 0 ? Number((message_total / session_total).toFixed(1)) : 0
			},
			usage,
			activity: {
				today: {
					sessions: sessions_today,
					messages: messages_today,
					posts: posts_today,
					rewires: countValue('SELECT COUNT(*) AS value FROM rewire_event WHERE created_at >= ?', [
						last_day
					]),
					tokens: pthink_analytics.windows.day.total_tokens,
					assistant_messages: pthink_analytics.windows.day.assistant_messages
				},
				week: {
					sessions: sessions_week,
					messages: messages_week,
					posts: posts_week,
					rewires: rewire_event_week,
					tokens: usage.week_total_tokens,
					assistant_messages: pthink_analytics.windows.week.assistant_messages
				},
				top_projects: pthink_analytics.active_projects,
				top_sessions: pthink_analytics.active_sessions,
				project_focus_concentration
			},
			content: {
				document_total,
				article_total,
				chunk_total,
				post_total,
				posts_ready_total,
				post_completion_rate: post_total > 0 ? round((posts_ready_total / post_total) * 100) : 100,
				post_streak_days,
				days_since_last_post,
				link_total,
				link_ready_total,
				link_pending_total,
				link_fail_total,
				documents_pending,
				articles_pending,
				posts_pending,
				post_for_counts,
				long_article_total,
				avg_chunks_per_article: article_total > 0 ? Number((chunk_total / article_total).toFixed(1)) : 0
			},
			system: {
				agent_total,
				group_total,
				project_total,
				skill_total,
				notification_total,
				notification_unread,
				notification_pushed,
				notification_unpushed,
				im_account_total,
				im_account_enabled,
				im_peer_total
			},
			health: {
				backlog_pending_total,
				backlog_pressure_score,
				stale_unread_sessions_24h,
				stale_unread_sessions_72h,
				notification_push_rate:
					notification_total > 0 ? round((notification_pushed / notification_total) * 100) : 100,
				top_alert,
				has_meaningful_recent_activity:
					pthink_analytics.windows.day.messages >= 20 ||
					pthink_analytics.windows.day.total_tokens >= 6000 ||
					pthink_analytics.windows.day.new_posts >= 1 ||
					pthink_analytics.windows.day.rewire_events >= 10 ||
					pthink_analytics.windows.day.new_notifications >= 4
			},
			memory: {
				node_total,
				frozen_node_total,
				node_week_total,
				edge_total,
				frozen_edge_total,
				edge_week_total,
				active_edge_total,
				silent_edge_total,
				unstable_edge_total,
				unstable_edge_ratio: edge_total > 0 ? round((unstable_edge_total / edge_total) * 100) : 0,
				avg_edge_stability: round(Number(edge_stats_row?.avg_stability ?? 0), 2),
				avg_edge_rewire_score: round(Number(edge_stats_row?.avg_rewire_score ?? 0), 2),
				rewire_event_total,
				rewire_event_week
			},
			recent: {
				sessions: recent_sessions,
				posts: recent_posts,
				notifications: recent_notifications,
				pthink_reports: recent_pthink_reports
			},
			pthink: {
				status: pthink_status,
				report_total: pthink_report_total,
				report_week: pthink_report_week,
				report_today: pthink_report_today
			},
			trends,
			coverage: {
				has_usage_telemetry: true,
				note: 'Token usage is aggregated directly from message.metadata.usage. Model usage is inferred from message sender, linked agent, linked project, then default model.'
			}
		}
	})
