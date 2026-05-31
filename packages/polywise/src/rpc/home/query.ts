import {
	getAgents,
	getGroups,
	getHomePeriodMetrics,
	getHomePeriodStart,
	getHomePthinkKindCounts,
	getHomeUsageAnalytics
} from '@core/db/services'
import { buildPthinkAnalytics, getPthinkConfig, pickPthinkTrigger, readPthinkStatus } from '@core/pthink'
import { p } from '@core/utils'
import { enum as Enum, object } from 'zod'

import { env } from '../../env'

const week_ms = 7 * 24 * 60 * 60 * 1000
const day_ms = 24 * 60 * 60 * 1000
const second_ms = 1000
const trend_days = 14
const heatmap_weeks = 48
const heatmap_days = heatmap_weeks * 7
const organic_post_filter = `json_extract(metadata, '$.pthink.kind') IS NULL`
const home_stats_period_schema = Enum(['day', 'week', 'month', 'year', 'total'])

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
			`SELECT DISTINCT strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key
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

const buildDailyTrendRows = (now: number) => {
	const start_at = getDayStart(now - (trend_days - 1) * day_ms)
	const db_start_at = toUnixSeconds(start_at)
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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
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
		.all(db_start_at) as Array<{
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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM message
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM session
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM document
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM rewire_event
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM notification
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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

const buildActivityHeatmapRows = (now: number) => {
	const start_at = getDayStart(now - (heatmap_days - 1) * day_ms)
	const db_start_at = toUnixSeconds(start_at)
	const buckets = Array.from({ length: heatmap_days }, (_, index) => {
		const ts = start_at + index * day_ms

		return {
			date: getDayKey(ts),
			timestamp: ts,
			messages: 0,
			new_sessions: 0,
			new_posts: 0,
			rewire_events: 0,
			pthink_reports: 0
		}
	})
	const bucket_map = new Map(buckets.map(item => [item.date, item]))

	const message_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM message
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM session
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of post_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.new_posts = Number(row.value ?? 0)
		}
	}

	const rewire_rows = env.sqlite
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM rewire_event
			WHERE created_at >= ?
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

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
				strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS day_key,
				COUNT(*) AS value
			FROM article
			WHERE created_at >= ?
				AND "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
			GROUP BY day_key`
		)
		.all(db_start_at) as Array<{ day_key: string | null; value: number | null }>

	for (const row of pthink_rows) {
		if (!row.day_key) {
			continue
		}

		const target = bucket_map.get(row.day_key)

		if (target) {
			target.pthink_reports = Number(row.value ?? 0)
		}
	}

	return buckets
}

const buildAgentWorkspaceStats = async (period_start: number | null) => {
	const db_period_start = period_start === null ? null : toUnixSeconds(period_start)
	const period_params = db_period_start === null ? [] : [db_period_start]
	const [agent_rows, group_rows] = await Promise.all([getAgents(), getGroups()])
	const agent_session_total_rows = env.sqlite
		.prepare(
			`SELECT
				agent_id,
				COUNT(DISTINCT session_id) AS session_total
			FROM agent_session
			GROUP BY agent_id`
		)
		.all() as Array<{ agent_id: string | null; session_total: number | null }>
	const agent_activity_rows = env.sqlite
		.prepare(
			`SELECT
				ag.agent_id AS agent_id,
				COUNT(DISTINCT m.session_id) AS session_count,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_active_at
			FROM agent_session ag
			LEFT JOIN message m
				ON m.session_id = ag.session_id
				${db_period_start === null ? '' : 'AND m.created_at >= ?'}
			GROUP BY ag.agent_id`
		)
		.all(...period_params) as Array<{
		agent_id: string | null
		session_count: number | null
		message_count: number | null
		last_active_at: number | null
	}>
	const agent_usage_rows = env.sqlite
		.prepare(
			`SELECT
				ag.agent_id AS agent_id,
				COUNT(m.id) AS assistant_replies,
				SUM(COALESCE(json_extract(m.content, '$.metadata.usage.totalTokens'), 0)) AS total_tokens
			FROM agent_session ag
			LEFT JOIN message m
				ON m.session_id = ag.session_id
				AND m.role = 'assistant'
				AND json_extract(m.content, '$.metadata.usage.totalTokens') IS NOT NULL
				${db_period_start === null ? '' : 'AND m.created_at >= ?'}
			GROUP BY ag.agent_id`
		)
		.all(...period_params) as Array<{
		agent_id: string | null
		assistant_replies: number | null
		total_tokens: number | null
	}>
	const agent_article_rows = env.sqlite
		.prepare(
			`SELECT
				aa.agent_id AS agent_id,
				COUNT(DISTINCT aa.article_id) AS article_count,
				SUM(CASE WHEN ar."for" IN ('user', 'wiki', 'memory') AND ${organic_post_filter} THEN 1 ELSE 0 END) AS post_count
			FROM agent_article aa
			INNER JOIN article ar ON ar.id = aa.article_id
			${db_period_start === null ? '' : 'WHERE aa.created_at >= ?'}
			GROUP BY aa.agent_id`
		)
		.all(...period_params) as Array<{
		agent_id: string | null
		article_count: number | null
		post_count: number | null
	}>
	const agent_document_rows = env.sqlite
		.prepare(
			`SELECT
				agent_id,
				COUNT(DISTINCT document_id) AS document_count
			FROM agent_document
			${db_period_start === null ? '' : 'WHERE created_at >= ?'}
			GROUP BY agent_id`
		)
		.all(...period_params) as Array<{ agent_id: string | null; document_count: number | null }>
	const group_member_rows = env.sqlite
		.prepare(
			`SELECT
				group_id,
				COUNT(agent_id) AS agent_count
			FROM group_agent
			GROUP BY group_id`
		)
		.all() as Array<{ group_id: string | null; agent_count: number | null }>
	const group_session_total_rows = env.sqlite
		.prepare(
			`SELECT
				group_id,
				COUNT(DISTINCT session_id) AS session_total
			FROM group_session
			GROUP BY group_id`
		)
		.all() as Array<{ group_id: string | null; session_total: number | null }>
	const group_activity_rows = env.sqlite
		.prepare(
			`SELECT
				gs.group_id AS group_id,
				COUNT(DISTINCT m.session_id) AS session_count,
				COUNT(m.id) AS message_count,
				MAX(m.created_at) AS last_active_at
			FROM group_session gs
			LEFT JOIN message m
				ON m.session_id = gs.session_id
				${db_period_start === null ? '' : 'AND m.created_at >= ?'}
			GROUP BY gs.group_id`
		)
		.all(...period_params) as Array<{
		group_id: string | null
		session_count: number | null
		message_count: number | null
		last_active_at: number | null
	}>
	const group_usage_rows = env.sqlite
		.prepare(
			`SELECT
				gs.group_id AS group_id,
				COUNT(m.id) AS assistant_replies,
				SUM(COALESCE(json_extract(m.content, '$.metadata.usage.totalTokens'), 0)) AS total_tokens
			FROM group_session gs
			LEFT JOIN message m
				ON m.session_id = gs.session_id
				AND m.role = 'assistant'
				AND json_extract(m.content, '$.metadata.usage.totalTokens') IS NOT NULL
				${db_period_start === null ? '' : 'AND m.created_at >= ?'}
			GROUP BY gs.group_id`
		)
		.all(...period_params) as Array<{
		group_id: string | null
		assistant_replies: number | null
		total_tokens: number | null
	}>

	const agent_session_total_map = new Map(
		agent_session_total_rows.map(item => [String(item.agent_id ?? ''), Number(item.session_total ?? 0)])
	)
	const agent_activity_map = new Map(agent_activity_rows.map(item => [String(item.agent_id ?? ''), item]))
	const agent_usage_map = new Map(agent_usage_rows.map(item => [String(item.agent_id ?? ''), item]))
	const agent_article_map = new Map(agent_article_rows.map(item => [String(item.agent_id ?? ''), item]))
	const agent_document_map = new Map(agent_document_rows.map(item => [String(item.agent_id ?? ''), item]))
	const group_member_map = new Map(
		group_member_rows.map(item => [String(item.group_id ?? ''), Number(item.agent_count ?? 0)])
	)
	const group_session_total_map = new Map(
		group_session_total_rows.map(item => [String(item.group_id ?? ''), Number(item.session_total ?? 0)])
	)
	const group_activity_map = new Map(group_activity_rows.map(item => [String(item.group_id ?? ''), item]))
	const group_usage_map = new Map(group_usage_rows.map(item => [String(item.group_id ?? ''), item]))

	const agent_items = agent_rows.map(item => {
		const activity = agent_activity_map.get(item.id)
		const usage = agent_usage_map.get(item.id)
		const article = agent_article_map.get(item.id)
		const document = agent_document_map.get(item.id)

		return {
			id: item.id,
			name: item.name || 'Untitled agent',
			photo: item.photo ?? null,
			avatar: item.avatar ?? null,
			session_total: agent_session_total_map.get(item.id) ?? 0,
			session_count: Number(activity?.session_count ?? 0),
			message_count: Number(activity?.message_count ?? 0),
			assistant_replies: Number(usage?.assistant_replies ?? 0),
			total_tokens: Number(usage?.total_tokens ?? 0),
			article_count: Number(article?.article_count ?? 0),
			post_count: Number(article?.post_count ?? 0),
			document_count: Number(document?.document_count ?? 0),
			last_active_at: Number(activity?.last_active_at ?? 0)
		}
	})
	const group_items = group_rows.map(item => {
		const activity = group_activity_map.get(item.id)
		const usage = group_usage_map.get(item.id)

		return {
			id: item.id,
			name: item.name || 'Untitled group',
			photo: item.photo ?? null,
			agent_count: group_member_map.get(item.id) ?? 0,
			session_total: group_session_total_map.get(item.id) ?? 0,
			session_count: Number(activity?.session_count ?? 0),
			message_count: Number(activity?.message_count ?? 0),
			assistant_replies: Number(usage?.assistant_replies ?? 0),
			total_tokens: Number(usage?.total_tokens ?? 0),
			last_active_at: Number(activity?.last_active_at ?? 0)
		}
	})
	const top_agents = agent_items
		.filter(
			item =>
				item.session_total > 0 ||
				item.message_count > 0 ||
				item.article_count > 0 ||
				item.document_count > 0
		)
		.sort((left, right) => {
			if (right.total_tokens !== left.total_tokens) {
				return right.total_tokens - left.total_tokens
			}

			if (right.message_count !== left.message_count) {
				return right.message_count - left.message_count
			}

			if (right.session_count !== left.session_count) {
				return right.session_count - left.session_count
			}

			return left.name.localeCompare(right.name)
		})
		.slice(0, 8)
	const top_groups = group_items
		.filter(
			item =>
				item.agent_count > 0 ||
				item.session_total > 0 ||
				item.message_count > 0 ||
				item.total_tokens > 0
		)
		.sort((left, right) => {
			if (right.total_tokens !== left.total_tokens) {
				return right.total_tokens - left.total_tokens
			}

			if (right.message_count !== left.message_count) {
				return right.message_count - left.message_count
			}

			if (right.session_count !== left.session_count) {
				return right.session_count - left.session_count
			}

			return left.name.localeCompare(right.name)
		})
		.slice(0, 8)

	return {
		summary: {
			active_agents: agent_items.filter(item => item.message_count > 0).length,
			active_groups: group_items.filter(item => item.message_count > 0).length,
			agents_with_sessions_total: agent_items.filter(item => item.session_total > 0).length,
			agents_with_content_total: agent_items.filter(
				item => item.article_count > 0 || item.document_count > 0
			).length,
			groups_with_sessions_total: group_items.filter(item => item.session_total > 0).length,
			groups_with_members_total: group_items.filter(item => item.agent_count > 0).length,
			agent_sessions_total: countValue('SELECT COUNT(*) AS value FROM agent_session'),
			group_sessions_total: countValue('SELECT COUNT(*) AS value FROM group_session'),
			period_messages_by_agents: agent_items.reduce((sum, item) => sum + item.message_count, 0),
			period_messages_by_groups: group_items.reduce((sum, item) => sum + item.message_count, 0),
			period_tokens_by_agents: agent_items.reduce((sum, item) => sum + item.total_tokens, 0),
			period_tokens_by_groups: group_items.reduce((sum, item) => sum + item.total_tokens, 0)
		},
		top_agents,
		top_groups
	}
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/home/query',
			description:
				'Return dashboard analytics for the home page, including activity, usage, pthink, posts, and trend summaries.'
		}
	})
	.input(
		object({
			period: home_stats_period_schema.optional()
		})
	)
	.query(async ({ input }) => {
		const now = Date.now()
		const period = input.period ?? 'week'
		const period_start = getHomePeriodStart(now, period)
		const last_day = now - day_ms
		const last_three_days = now - 3 * day_ms
		const last_week = now - week_ms
		const today_key = getDayKey(now)
		const pthink_config = getPthinkConfig()
		const usage = getHomeUsageAnalytics(period_start)
		const period_metrics = getHomePeriodMetrics(period_start)
		const trends = buildDailyTrendRows(now)
		const activity_heatmap = buildActivityHeatmapRows(now)
		const agent_workspace = await buildAgentWorkspaceStats(period_start)
		const pthink_analytics = buildPthinkAnalytics(now)
		const pthink_status = await readPthinkStatus()
		const top_alert = pthink_config.enabled
			? pickPthinkTrigger({
					analytics: pthink_analytics,
					status: pthink_status,
					now,
					trigger_cooldown_ms: pthink_config.review_cooldown_ms
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
		const { node_week_total } = period_metrics
		const edge_total = countValue('SELECT COUNT(*) AS value FROM edge')
		const frozen_edge_total = countValue('SELECT COUNT(*) AS value FROM edge WHERE is_frozen = 1')
		const { edge_week_total } = period_metrics
		const active_edge_total = countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'active'")
		const silent_edge_total = countValue("SELECT COUNT(*) AS value FROM edge WHERE state = 'silent'")
		const unstable_edge_total = countValue(
			"SELECT COUNT(*) AS value FROM edge WHERE state = 'silent' OR stability < 0.3 OR rewire_score >= 0.5"
		)
		const rewire_event_total = countValue('SELECT COUNT(*) AS value FROM rewire_event')
		const { rewire_event_week } = period_metrics
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
		const { sessions_week } = period_metrics
		const sessions_active_24h = countValue('SELECT COUNT(*) AS value FROM session WHERE updated_at >= ?', [
			last_day
		])
		const sessions_warm_72h = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE updated_at < ? AND updated_at >= ?',
			[last_day, last_three_days]
		)
		const sessions_cooling_week = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE updated_at < ? AND updated_at >= ?',
			[last_three_days, last_week]
		)
		const sessions_dormant_over_week = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE updated_at < ?',
			[last_week]
		)
		const { sessions_with_messages_week } = period_metrics
		const stale_unread_sessions_24h = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			[last_day]
		)
		const stale_unread_sessions_72h = countValue(
			'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			[last_three_days]
		)
		const { sessions_without_followup_week, idle_sessions_week } = period_metrics
		const messages_today = countValue('SELECT COUNT(*) AS value FROM message WHERE created_at >= ?', [last_day])
		const { messages_week } = period_metrics

		const documents_pending = countValue('SELECT COUNT(*) AS value FROM document WHERE is_pipelined = 0')
		const { documents_week_total } = period_metrics
		const articles_pending = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE is_pipelined = 0 AND \"for\" NOT IN ('user', 'wiki', 'memory')"
		)
		const { articles_week_total } = period_metrics
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
		const { links_week_total } = period_metrics
		const link_fail_total = countValue("SELECT COUNT(*) AS value FROM link WHERE status = 'fail'")
		const intake_week_total = documents_week_total + articles_week_total + links_week_total
		const posts_with_session_total = countValue(
			`SELECT COUNT(*) AS value
			FROM post_session ps
			INNER JOIN article a ON ps.post_id = a.id
			WHERE a."for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`
		)
		const posts_with_project_total = countValue(
			`SELECT COUNT(DISTINCT pp.post_id) AS value
			FROM post_project pp
			INNER JOIN article a ON pp.post_id = a.id
			WHERE a."for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`
		)
		const { posts_week_with_session, posts_week_with_project, agents_active_week } = period_metrics
		const agents_with_content_total = countValue(
			`SELECT COUNT(DISTINCT agent_id) AS value
			FROM (
				SELECT agent_id FROM agent_article
				UNION
				SELECT agent_id FROM agent_document
			)`
		)
		const oldest_pending_row = env.sqlite
			.prepare(
				`SELECT item_type, updated_at
				FROM (
					SELECT 'document' AS item_type, updated_at FROM document WHERE is_pipelined = 0
					UNION ALL
					SELECT 'article' AS item_type, updated_at
					FROM article
					WHERE is_pipelined = 0 AND "for" NOT IN ('user', 'wiki', 'memory')
					UNION ALL
					SELECT 'post' AS item_type, updated_at
					FROM article
					WHERE is_pipelined = 0
						AND "for" IN ('user', 'wiki', 'memory')
						AND ${organic_post_filter}
					UNION ALL
					SELECT 'link' AS item_type, updated_at
					FROM link
					WHERE status IN ('pending', 'none')
				)
				ORDER BY updated_at ASC
				LIMIT 1`
			)
			.get() as { item_type?: string | null; updated_at?: number | null } | undefined

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
		const { posts_week } = period_metrics
		const last_post_at_row = env.sqlite
			.prepare(
				`SELECT MAX(updated_at) AS value
				FROM article
				WHERE "for" IN ('user', 'wiki', 'memory')
					AND ${organic_post_filter}`
			)
			.get() as { value?: number | null } | undefined
		const last_post_at = Number(last_post_at_row?.value ?? 0)
		const days_since_last_post = last_post_at ? Math.floor((now - last_post_at * second_ms) / day_ms) : null
		const post_streak_days = readOrganicPostStreak(today_key)
		const backlog_pending_total = documents_pending + articles_pending + posts_pending + link_pending_total
		const pipeline_created_week_total =
			documents_week_total + articles_week_total + posts_week + links_week_total
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
		const pthink_kind_counts_total = getHomePthinkKindCounts()
		const { pthink_kind_counts_week, pthink_report_week } = period_metrics
		const pthink_report_total = countValue(
			"SELECT COUNT(*) AS value FROM article WHERE \"for\" = 'memory' AND json_extract(metadata, '$.pthink.kind') IS NOT NULL"
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
				sessions_active_24h,
				sessions_warm_72h,
				sessions_cooling_week,
				sessions_dormant_over_week,
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
					tokens: usage.period_total_tokens,
					assistant_messages: usage.period_assistant_messages
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
				documents_week_total,
				articles_pending,
				articles_week_total,
				posts_pending,
				pipeline_created_week_total,
				intake_week_total,
				post_for_counts,
				posts_with_session_total,
				posts_with_project_total,
				posts_week_with_session,
				posts_week_with_project,
				long_article_total,
				avg_chunks_per_article:
					article_total > 0 ? Number((chunk_total / article_total).toFixed(1)) : 0,
				links_week_total,
				oldest_pending_item:
					oldest_pending_row?.item_type && oldest_pending_row?.updated_at
						? {
								type: String(oldest_pending_row.item_type),
								updated_at: Number(oldest_pending_row.updated_at)
							}
						: null
			},
			system: {
				agent_total,
				agents_active_week,
				agents_with_content_total,
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
			agents: agent_workspace,
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
			pthink: {
				status: pthink_status,
				report_total: pthink_report_total,
				report_week: pthink_report_week,
				report_today: pthink_report_today,
				kind_counts_total: pthink_kind_counts_total,
				kind_counts_week: pthink_kind_counts_week
			},
			trends,
			activity_heatmap,
			coverage: {
				has_usage_telemetry: true,
				note: 'Token usage is aggregated directly from message.metadata.usage. Model usage is inferred from message sender, linked agent, linked project, then default model.'
			}
		}
	})
