import { config } from '@core/config'
import { env } from '@core/env'

const week_ms = 7 * 24 * 60 * 60 * 1000
const day_ms = 24 * 60 * 60 * 1000
const month_ms = 30 * day_ms
const year_ms = 365 * day_ms
const second_ms = 1000
const organic_post_filter = `json_extract(metadata, '$.pthink.kind') IS NULL`

export type HomeStatsPeriod = 'day' | 'week' | 'month' | 'year' | 'total'

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

export const getHomePthinkKindCounts = (start_at?: number) => {
	const rows = env.sqlite
		.prepare(
			`SELECT
				json_extract(metadata, '$.pthink.kind') AS kind,
				COUNT(*) AS value
			FROM article
			WHERE "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
				${start_at ? 'AND created_at >= ?' : ''}
			GROUP BY kind`
		)
		.all(...(start_at ? [normalizeDbParam(start_at)] : [])) as Array<{
		kind?: string | null
		value?: number | null
	}>

	const counts = {
		review: 0
	}

	for (const row of rows) {
		if (row.kind === 'review') {
			counts[row.kind] = Number(row.value ?? 0)
		}
	}

	return counts
}

export const getHomePeriodStart = (now: number, period: HomeStatsPeriod) => {
	switch (period) {
		case 'day':
			return now - day_ms
		case 'week':
			return now - week_ms
		case 'month':
			return now - month_ms
		case 'year':
			return now - year_ms
		case 'total':
			return null
	}
}

export const getHomeUsageAnalytics = (period_start: number | null) => {
	const db_period_start = period_start === null ? null : toUnixSeconds(period_start)
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
		period_assistant_messages: 0,
		period_input_tokens: 0,
		period_output_tokens: 0,
		period_total_tokens: 0,
		period_reasoning_tokens: 0,
		period_cached_input_tokens: 0
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

		const in_period = db_period_start === null || Number(row.created_at ?? 0) >= db_period_start

		if (!in_period) {
			continue
		}

		totals.period_assistant_messages += 1
		totals.period_input_tokens += input_tokens
		totals.period_output_tokens += output_tokens
		totals.period_total_tokens += total_tokens
		totals.period_reasoning_tokens += reasoning_tokens
		totals.period_cached_input_tokens += cached_input_tokens

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
		avg_period_total_tokens_per_reply:
			totals.period_assistant_messages > 0
				? Number((totals.period_total_tokens / totals.period_assistant_messages).toFixed(1))
				: 0,
		providers: Array.from(provider_totals.values()).sort((a, b) => b.total_tokens - a.total_tokens),
		models: Array.from(model_totals.values())
			.sort((a, b) => b.total_tokens - a.total_tokens)
			.slice(0, 8)
	}
}

export const getHomePeriodMetrics = (period_start: number | null) => {
	const period_params = period_start === null ? [] : [period_start]

	return {
		node_week_total: countValue(
			`SELECT COUNT(*) AS value FROM node ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		edge_week_total: countValue(
			`SELECT COUNT(*) AS value FROM edge ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		rewire_event_week: countValue(
			`SELECT COUNT(*) AS value FROM rewire_event ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		sessions_week: countValue(
			`SELECT COUNT(*) AS value FROM session ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		sessions_with_messages_week: countValue(
			`SELECT COUNT(DISTINCT session_id) AS value FROM message ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		sessions_without_followup_week: countValue(
			period_start === null
				? 'SELECT COUNT(*) AS value FROM session WHERE unread = 1'
				: 'SELECT COUNT(*) AS value FROM session WHERE unread = 1 AND updated_at < ?',
			period_start === null ? [] : [period_start]
		),
		idle_sessions_week: countValue(
			period_start === null
				? 'SELECT COUNT(*) AS value FROM session WHERE runing = 0'
				: 'SELECT COUNT(*) AS value FROM session WHERE runing = 0 AND updated_at < ?',
			period_start === null ? [] : [period_start]
		),
		messages_week: countValue(
			`SELECT COUNT(*) AS value FROM message ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		documents_week_total: countValue(
			`SELECT COUNT(*) AS value FROM document ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		articles_week_total: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE 1 = 1
				${period_start === null ? '' : 'AND created_at >= ?'}
				AND "for" NOT IN ('user', 'wiki', 'memory')`,
			period_params
		),
		links_week_total: countValue(
			`SELECT COUNT(*) AS value FROM link ${period_start === null ? '' : 'WHERE created_at >= ?'}`,
			period_params
		),
		posts_week_with_session: countValue(
			`SELECT COUNT(*) AS value
			FROM post_session ps
			INNER JOIN article a ON ps.post_id = a.id
			WHERE 1 = 1
				${period_start === null ? '' : 'AND a.created_at >= ?'}
				AND a."for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`,
			period_params
		),
		posts_week_with_project: countValue(
			`SELECT COUNT(DISTINCT pp.post_id) AS value
			FROM post_project pp
			INNER JOIN article a ON pp.post_id = a.id
			WHERE 1 = 1
				${period_start === null ? '' : 'AND a.created_at >= ?'}
				AND a."for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`,
			period_params
		),
		agents_active_week: countValue(
			`SELECT COUNT(DISTINCT ag.agent_id) AS value
			FROM agent_session ag
			INNER JOIN message m ON m.session_id = ag.session_id
			${period_start === null ? '' : 'WHERE m.created_at >= ?'}`,
			period_params
		),
		posts_week: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE 1 = 1
				${period_start === null ? '' : 'AND created_at >= ?'}
				AND "for" IN ('user', 'wiki', 'memory')
				AND ${organic_post_filter}`,
			period_params
		),
		pthink_kind_counts_week: getHomePthinkKindCounts(period_start ?? undefined),
		pthink_report_week: countValue(
			`SELECT COUNT(*) AS value FROM article
			WHERE "for" = 'memory'
				AND json_extract(metadata, '$.pthink.kind') IS NOT NULL
				${period_start === null ? '' : 'AND created_at >= ?'}`,
			period_params
		)
	}
}
