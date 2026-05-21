import { config } from '@core/config'
import { readPthinkStatus } from '@core/pthink'
import { p } from '@core/utils'

import { env } from '../../env'

const week_ms = 7 * 24 * 60 * 60 * 1000
const organic_post_filter = `json_extract(metadata, '$.pthink.kind') IS NULL`

const countValue = (query: string, params: Array<unknown> = []) => {
	const row = env.sqlite.prepare(query).get(...params) as { value?: number } | undefined

	return Number(row?.value ?? 0)
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

export default p.query(async () => {
	const now = Date.now()
	const last_week = now - week_ms
	const usage = buildUsageAnalytics(last_week)
	const pthink_status = await readPthinkStatus()

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
	const im_account_total = countValue('SELECT COUNT(*) AS value FROM im_account')
	const im_account_enabled = countValue('SELECT COUNT(*) AS value FROM im_account WHERE enabled = 1')
	const im_peer_total = countValue('SELECT COUNT(*) AS value FROM im_peer_state')
	const node_total = countValue('SELECT COUNT(*) AS value FROM node')
	const frozen_node_total = countValue('SELECT COUNT(*) AS value FROM node WHERE is_frozen = 1')
	const edge_total = countValue('SELECT COUNT(*) AS value FROM edge')
	const frozen_edge_total = countValue('SELECT COUNT(*) AS value FROM edge WHERE is_frozen = 1')
	const rewire_event_total = countValue('SELECT COUNT(*) AS value FROM rewire_event')
	const rewire_event_week = countValue('SELECT COUNT(*) AS value FROM rewire_event WHERE created_at >= ?', [
		last_week
	])

	const sessions_running = countValue('SELECT COUNT(*) AS value FROM session WHERE runing = 1')
	const sessions_unread = countValue('SELECT COUNT(*) AS value FROM session WHERE unread = 1')
	const sessions_im = countValue('SELECT COUNT(*) AS value FROM session WHERE im = 1')
	const sessions_cron = countValue('SELECT COUNT(*) AS value FROM session WHERE cron = 1')
	const sessions_week = countValue('SELECT COUNT(*) AS value FROM session WHERE created_at >= ?', [last_week])
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
	const link_pending_total = countValue("SELECT COUNT(*) AS value FROM link WHERE status IN ('pending', 'none')")

	const post_for_counts = readPostForCounts()
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
			sessions_week,
			message_total,
			messages_week,
			avg_messages_per_session: session_total > 0 ? Number((message_total / session_total).toFixed(1)) : 0
		},
		usage,
		content: {
			document_total,
			article_total,
			chunk_total,
			link_total,
			link_ready_total,
			link_pending_total,
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
			im_account_total,
			im_account_enabled,
			im_peer_total
		},
		memory: {
			node_total,
			frozen_node_total,
			edge_total,
			frozen_edge_total,
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
		coverage: {
			has_usage_telemetry: true,
			note: 'Token usage is aggregated directly from message.metadata.usage. Model usage is inferred from message sender, linked agent, linked project, then default model.'
		}
	}
})
