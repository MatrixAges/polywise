import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { generateText, Output } from 'ai'
import dayjs from 'dayjs'
import { pick } from 'es-toolkit'
import { z } from 'zod'

import type { SpecialProvider } from '@core/types'
import type { PthinkAnalyticsSnapshot, PthinkDraftReport, PthinkReportKind, PthinkTriggerCandidate } from './types'

const synthesis_schema = z.object({
	title: z.string(),
	summary: z.string(),
	insights: z.array(z.string()).min(2).max(4),
	focus: z.array(z.string()).min(1).max(3)
})

const resolveDefaultTextModel = async () => {
	const target_config = config.default_model
	const { provider, model, effort } = target_config
	const custom_list = providers.custom_providers ?? []
	const found_provider = [...providers.providers, ...custom_list].find(item => item.name === provider)
	const target_options = found_provider
		? {
				...pick(found_provider, ['apiKey', 'baseURL']),
				...(found_provider as SpecialProvider).custom_fields
			}
		: undefined
	const provider_name = custom_list.some(item => item.name === provider) ? 'open_compatible' : provider

	return getModel({
		provider: provider_name,
		model,
		effort,
		options: target_options,
		model_tool: false
	})
}

const buildFallback = (args: {
	kind: PthinkReportKind
	analytics: PthinkAnalyticsSnapshot
	trigger?: PthinkTriggerCandidate | null
}) => {
	const { kind, analytics, trigger } = args
	const day = analytics.windows.day
	const week = analytics.windows.week
	const title_prefix =
		kind === 'daily'
			? 'PThink Daily Report'
			: kind === 'weekly'
				? 'PThink Weekly Report'
				: kind === 'trigger'
					? `PThink Trigger · ${trigger?.label ?? 'Insight'}`
					: 'PThink Idle Digest'
	const title = `${title_prefix} · ${dayjs(analytics.generated_at).format('YYYY-MM-DD HH:mm')}`
	const summary_parts = [
		`${day.messages} messages and ${day.total_tokens} tokens in the last 24 hours`,
		`${day.new_posts} new posts`,
		`${day.rewire_events} rewire events`
	]
	const summary = summary_parts.join(' · ')
	const insights = [
		day.total_tokens > 0
			? `AI activity stayed meaningful, with ${day.assistant_messages} assistant replies driving ${day.total_tokens} tokens over the last day.`
			: 'Recent activity came more from content or task movement than from model calls.',
		day.new_posts > 0 || day.new_memory_posts > 0
			? `Knowledge assets kept moving: ${day.new_posts} new posts landed, including ${day.new_memory_posts} memory posts.`
			: 'Knowledge assets did not expand much in the last day, so most momentum was operational rather than archival.',
		day.pending_posts + day.pending_documents + day.pending_links > 0
			? `There is still backlog pressure with ${day.pending_posts + day.pending_documents + day.pending_links} pending pipeline items.`
			: 'Pipeline pressure is low, so the workspace is mostly keeping up with throughput.'
	]
	const focus = [
		day.pending_posts + day.pending_documents + day.pending_links > 0
			? 'Clear pending pipeline items before they turn into stale context.'
			: 'Turn the freshest sessions into durable posts while context is still warm.',
		week.total_tokens > 30_000
			? 'Review the heaviest model flows and decide whether the current default model is still the right cost/quality tradeoff.'
			: 'Keep an eye on whether usage is concentrated in a small number of sessions or spreading across too many threads.'
	]

	return {
		title,
		summary,
		content: buildMarkdown({
			title,
			summary,
			insights,
			focus,
			kind,
			analytics,
			trigger
		})
	} satisfies PthinkDraftReport
}

const buildMarkdown = (args: {
	title: string
	summary: string
	insights: Array<string>
	focus: Array<string>
	kind: PthinkReportKind
	analytics: PthinkAnalyticsSnapshot
	trigger?: PthinkTriggerCandidate | null
}) => {
	const { title, summary, insights, focus, kind, analytics, trigger } = args
	const day = analytics.windows.day
	const week = analytics.windows.week

	return [
		`# ${title}`,
		'',
		summary,
		'',
		'## Pulse',
		`- Last 24h: ${day.messages} messages, ${day.sessions} new sessions, ${day.total_tokens} tokens, ${day.new_posts} new posts`,
		`- Last 7d: ${week.messages} messages, ${week.sessions} new sessions, ${week.total_tokens} tokens, ${week.new_posts} new posts`,
		`- Knowledge graph: ${day.rewire_events} rewire events in 24h, ${analytics.totals.nodes} nodes and ${analytics.totals.edges} edges total`,
		'',
		'## Insights',
		...insights.map(item => `- ${item}`),
		'',
		'## Active Surfaces',
		...(analytics.active_sessions.length > 0
			? analytics.active_sessions.map(
					item => `- Session: ${item.title || 'Untitled'} · ${item.message_count} messages`
				)
			: ['- No session concentration stood out in the last week.']),
		...(analytics.active_projects.length > 0
			? analytics.active_projects.map(
					item =>
						`- Project: ${item.name} · ${item.message_count} messages across ${item.session_count} sessions`
				)
			: []),
		...(analytics.top_models.length > 0
			? [
					'',
					'## Model Mix',
					...analytics.top_models.map(
						item => `- ${item.label} · ${item.calls} calls · ${item.total_tokens} tokens`
					)
				]
			: []),
		'',
		'## Watchlist',
		`- Pending pipeline: ${day.pending_posts} posts, ${day.pending_documents} documents, ${day.pending_links} links`,
		`- Unread notifications: ${day.unread_notifications}`,
		...(kind === 'trigger' && trigger ? [`- Trigger: ${trigger.label} · ${trigger.detail}`] : []),
		'',
		'## Suggested Focus',
		...focus.map(item => `- ${item}`)
	].join('\n')
}

export const synthesizePthinkReport = async (args: {
	kind: PthinkReportKind
	analytics: PthinkAnalyticsSnapshot
	trigger?: PthinkTriggerCandidate | null
}) => {
	const fallback = buildFallback(args)

	try {
		const { model, provider_options } = await resolveDefaultTextModel()
		const { output } = await generateText({
			model,
			system: 'You write compact autonomous analytics reports for a local agentic content workspace. Use only supplied metrics. Be concrete, avoid generic productivity language, and focus on behavior, content flow, backlog pressure, and model usage.',
			prompt: JSON.stringify(
				{
					now: dayjs(args.analytics.generated_at).format('YYYY-MM-DD HH:mm:ss'),
					kind: args.kind,
					trigger: args.trigger,
					analytics: args.analytics
				},
				null,
				2
			),
			providerOptions: provider_options,
			output: Output.object({ schema: synthesis_schema })
		})
		const result = output as z.infer<typeof synthesis_schema>

		return {
			title: result.title.trim() || fallback.title,
			summary: result.summary.trim() || fallback.summary,
			content: buildMarkdown({
				title: result.title.trim() || fallback.title,
				summary: result.summary.trim() || fallback.summary,
				insights: result.insights
					.map(item => item.trim())
					.filter(Boolean)
					.slice(0, 4),
				focus: result.focus
					.map(item => item.trim())
					.filter(Boolean)
					.slice(0, 3),
				kind: args.kind,
				analytics: args.analytics,
				trigger: args.trigger
			})
		} satisfies PthinkDraftReport
	} catch {
		return fallback
	}
}
