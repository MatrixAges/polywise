import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { generateText, Output } from 'ai'
import dayjs from 'dayjs'
import { pick } from 'es-toolkit'
import { z } from 'zod'

import { chunkList, formatCompactNumber, formatReportTime } from './utils'

import type { SpecialProvider } from '@core/types'
import type { ReportAnalytics, ReportConversationSample, ReportPeriod, ReportTopicSummary } from './types'

const topic_schema = z.object({
	overview: z.string(),
	themes: z.array(z.string()).min(2).max(5),
	learnings: z.array(z.string()).min(2).max(5),
	advice: z.array(z.string()).min(2).max(4),
	im_focus: z.array(z.string()).max(3)
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

const toSampleLines = (samples: Array<ReportConversationSample>) =>
	samples.map(item => ({
		session: item.title,
		role: item.role,
		im: item.is_im,
		at: formatReportTime(item.created_at),
		text: item.text
	}))

const buildFallbackTopicSummary = (analytics: ReportAnalytics): ReportTopicSummary => {
	const day_or_window = analytics.window.period === 'day' ? 'day' : analytics.window.period
	const top_session = analytics.sessions.top_sessions[0]
	const top_project = analytics.sessions.top_projects[0]
	const top_im = analytics.sessions.top_im_sessions[0]

	return {
		overview: `This ${day_or_window} combined ${analytics.usage.message_count} messages, ${formatCompactNumber(analytics.usage.total_tokens)} tokens, ${analytics.sessions.new_sessions} new sessions, and ${analytics.content.new_posts} new posts, with the heaviest concentration around ${top_session?.title || 'a distributed set of sessions'}.`,
		themes: [
			top_session
				? `${top_session.title} was the dominant conversation surface with ${top_session.message_count} messages.`
				: 'Conversation volume was spread across many sessions without a single dominant thread.',
			top_project
				? `${top_project.name} was the most active project context by message volume.`
				: 'Project activity was either light or not strongly concentrated in a single project.',
			analytics.content.new_wiki_posts + analytics.content.new_memory_posts > 0
				? `Knowledge capture stayed active through ${analytics.content.new_wiki_posts} wiki posts and ${analytics.content.new_memory_posts} memory posts.`
				: 'Knowledge capture lagged behind conversation volume, so some learning likely remains unstored.'
		],
		learnings: [
			analytics.knowledge.new_nodes > 0 || analytics.knowledge.new_edges > 0
				? `The knowledge graph expanded by ${analytics.knowledge.new_nodes} nodes and ${analytics.knowledge.new_edges} edges.`
				: 'Graph growth was limited, which usually means insights were discussed more than encoded.',
			analytics.linkcase.processed_links > 0
				? `${analytics.linkcase.processed_links} links moved through extraction during this window.`
				: 'Link ingestion throughput was limited during this window.'
		],
		advice: [
			analytics.linkcase.ready_to_extract > 0
				? `Extract the ${analytics.linkcase.ready_to_extract} ready linkcase items to avoid knowledge lag.`
				: 'Keep converting the most valuable sessions into durable posts while context is fresh.',
			analytics.ops.backlog_pending > 0
				? `Reduce the current backlog of ${analytics.ops.backlog_pending} pending items before the next reporting cycle.`
				: 'The backlog is under control, so prioritize higher-quality synthesis over throughput.'
		],
		im_focus: top_im
			? [`${top_im.title} was the most active IM thread with ${top_im.message_count} messages.`]
			: []
	}
}

const summarizeChunk = async (args: {
	period: ReportPeriod
	samples: Array<ReportConversationSample>
	im_samples: Array<ReportConversationSample>
}) => {
	const fallback = buildFallbackTopicSummary({
		window: {
			period: args.period,
			offset: 0,
			key: '',
			label: '',
			title: '',
			start_at: 0,
			end_at: 0,
			file_name: '',
			file_path: ''
		},
		generated_at: Date.now(),
		usage: {
			message_count: args.samples.length,
			user_message_count: 0,
			assistant_message_count: 0,
			total_tokens: 0,
			input_tokens: 0,
			output_tokens: 0,
			reasoning_tokens: 0,
			cached_input_tokens: 0,
			models: [],
			providers: []
		},
		sessions: {
			new_sessions: 0,
			active_sessions: 0,
			im_sessions: 0,
			top_sessions: [],
			top_im_sessions: [],
			top_projects: []
		},
		content: {
			new_posts: 0,
			new_user_posts: 0,
			new_wiki_posts: 0,
			new_memory_posts: 0,
			updated_posts: 0,
			new_documents: 0,
			recent_posts: []
		},
		knowledge: {
			new_nodes: 0,
			total_nodes: 0,
			new_edges: 0,
			total_edges: 0,
			rewire_events: 0,
			active_edges: 0,
			silent_edges: 0,
			unstable_edges: 0,
			new_agent_articles: 0,
			top_agent_changes: []
		},
		linkcase: { new_links: 0, processed_links: 0, failed_links: 0, pending_links: 0, ready_to_extract: 0 },
		ops: { new_notifications: 0, unread_notifications: 0, im_peer_total: 0, backlog_pending: 0 },
		samples: { conversation: args.samples, im: args.im_samples }
	})

	try {
		const { model, provider_options } = await resolveDefaultTextModel()
		const { output } = await generateText({
			model,
			system: 'You summarize local AI workspace conversations into English reporting signals. Be specific about themes, learning, IM context, and what should happen next. Avoid generic productivity phrasing.',
			prompt: JSON.stringify(
				{
					period: args.period,
					conversation_samples: toSampleLines(args.samples),
					im_samples: toSampleLines(args.im_samples)
				},
				null,
				2
			),
			providerOptions: provider_options,
			output: Output.object({ schema: topic_schema })
		})

		return output as z.infer<typeof topic_schema>
	} catch {
		return fallback
	}
}

export const synthesizeTopicSummary = async (args: {
	period: ReportPeriod
	analytics: ReportAnalytics
	onProgress?: (detail: string, progress: number) => Promise<void> | void
}) => {
	const fallback = buildFallbackTopicSummary(args.analytics)
	const all_samples = args.analytics.samples.conversation
	const im_samples = args.analytics.samples.im

	if (all_samples.length === 0) {
		return fallback
	}

	if (args.period === 'day') {
		return summarizeChunk({
			period: args.period,
			samples: all_samples.slice(0, 32),
			im_samples: im_samples.slice(0, 12)
		})
	}

	const chunk_size_map: Record<Exclude<ReportPeriod, 'day'>, number> = {
		week: 28,
		month: 36,
		year: 40
	}
	const chunks = chunkList(all_samples, chunk_size_map[args.period]).slice(0, args.period === 'year' ? 6 : 5)
	const chunk_summaries = [] as Array<ReportTopicSummary>

	for (const [index, chunk] of chunks.entries()) {
		await args.onProgress?.(
			`Summarizing conversation chunk ${index + 1}/${chunks.length}`,
			0.35 + ((index + 1) / Math.max(1, chunks.length)) * 0.25
		)
		chunk_summaries.push(
			await summarizeChunk({
				period: args.period,
				samples: chunk,
				im_samples: im_samples.slice(index * 6, index * 6 + 6)
			})
		)
	}

	try {
		const { model, provider_options } = await resolveDefaultTextModel()
		const { output } = await generateText({
			model,
			system: 'You are merging chunk-level reporting notes into one English summary for a local AI workspace. Preserve concrete themes, learning, IM highlights, and next-step advice. Prefer concise, information-dense phrasing.',
			prompt: JSON.stringify(
				{
					period: args.period,
					window: {
						key: args.analytics.window.key,
						label: args.analytics.window.label,
						start: dayjs(args.analytics.window.start_at).format('YYYY-MM-DD HH:mm:ss'),
						end: dayjs(args.analytics.window.end_at).format('YYYY-MM-DD HH:mm:ss')
					},
					chunk_summaries
				},
				null,
				2
			),
			providerOptions: provider_options,
			output: Output.object({ schema: topic_schema })
		})

		return output as z.infer<typeof topic_schema>
	} catch {
		const themes = chunk_summaries.flatMap(item => item.themes).slice(0, 4)
		const learnings = chunk_summaries.flatMap(item => item.learnings).slice(0, 4)
		const advice = chunk_summaries.flatMap(item => item.advice).slice(0, 3)
		const im_focus = chunk_summaries.flatMap(item => item.im_focus).slice(0, 2)

		return {
			overview: chunk_summaries[0]?.overview || fallback.overview,
			themes: themes.length > 0 ? themes : fallback.themes,
			learnings: learnings.length > 0 ? learnings : fallback.learnings,
			advice: advice.length > 0 ? advice : fallback.advice,
			im_focus
		}
	}
}

export const buildReportPlan = (args: { analytics: ReportAnalytics }) => {
	const { analytics } = args
	const chunk_size_map = {
		week: 28,
		month: 36,
		year: 40
	} as const
	const chunk_size = analytics.window.period === 'day' ? 0 : chunk_size_map[analytics.window.period]
	const chunk_count =
		analytics.window.period === 'day'
			? 1
			: Math.max(1, Math.ceil(analytics.samples.conversation.length / chunk_size))

	return [
		`# Reporting Plan · ${analytics.window.title}`,
		'',
		`Generated at ${formatReportTime(analytics.generated_at)}.`,
		'',
		'## Execution Segments',
		'- Segment 1: Build the window baseline, metrics snapshot, and storage scaffold.',
		`- Segment 2: Summarize conversation history in ${chunk_count} chunk(s) for topic extraction.`,
		'- Segment 3: Synthesize IM, agent, memory graph, and linkcase movement.',
		'- Segment 4: Append recommendations and finalize the incremental report block.',
		'',
		'## Current Inputs',
		`- Messages sampled: ${analytics.samples.conversation.length}`,
		`- IM messages sampled: ${analytics.samples.im.length}`,
		`- Top sessions tracked: ${analytics.sessions.top_sessions.length}`,
		`- Recent posts tracked: ${analytics.content.recent_posts.length}`
	].join('\n')
}

const formatPercent = (value: number) => `${(value * 100).toFixed(value > 0 && value < 0.1 ? 1 : 0)}%`

export const buildReportPreamble = (args: { analytics: ReportAnalytics; incremental: boolean }) => {
	const { analytics, incremental } = args
	const header = incremental
		? `## Incremental Update · ${formatReportTime(analytics.generated_at)}`
		: `# ${analytics.window.title}`
	const prelude = incremental
		? [
				`> Window: ${analytics.window.label} (${formatReportTime(analytics.window.start_at)} to ${formatReportTime(analytics.window.end_at)}).`,
				`> File: \`${analytics.window.file_name}\``
			].join('\n')
		: [
				`> Generated in English. Window: ${formatReportTime(analytics.window.start_at)} to ${formatReportTime(analytics.window.end_at)}.`,
				`> File: \`${analytics.window.file_name}\``
			].join('\n')

	return [header, prelude].filter(Boolean).join('\n')
}

export const buildReportMetricsMarkdown = (args: { analytics: ReportAnalytics }) => {
	const { analytics } = args
	const cached_ratio =
		analytics.usage.input_tokens > 0 ? analytics.usage.cached_input_tokens / analytics.usage.input_tokens : 0
	const top_session = analytics.sessions.top_sessions[0]
	const top_project = analytics.sessions.top_projects[0]
	const stored_knowledge_posts = analytics.content.new_wiki_posts + analytics.content.new_memory_posts
	const content_split = [
		`${analytics.content.new_user_posts} user`,
		`${analytics.content.new_wiki_posts} wiki`,
		`${analytics.content.new_memory_posts} memory`
	].join(' · ')

	return [
		'### Window Snapshot',
		`- Tokens: ${formatCompactNumber(analytics.usage.total_tokens)} total · ${formatCompactNumber(analytics.usage.input_tokens)} input · ${formatCompactNumber(analytics.usage.output_tokens)} output · ${formatCompactNumber(analytics.usage.reasoning_tokens)} reasoning`,
		`- Messages: ${analytics.usage.message_count} total · ${analytics.usage.user_message_count} user · ${analytics.usage.assistant_message_count} assistant`,
		`- Sessions: ${analytics.sessions.new_sessions} new · ${analytics.sessions.active_sessions} active · ${analytics.sessions.im_sessions} IM`,
		`- Content: ${analytics.content.new_posts} new posts · ${analytics.content.updated_posts} updated posts · ${analytics.content.new_documents} new documents`,
		`- Memory graph: +${analytics.knowledge.new_nodes} nodes · +${analytics.knowledge.new_edges} edges · ${analytics.knowledge.rewire_events} rewires`,
		`- Linkcase: ${analytics.linkcase.new_links} new links · ${analytics.linkcase.processed_links} processed · ${analytics.linkcase.ready_to_extract} ready to extract`,
		'',
		'### Metric Signals',
		`- Cached input ratio: ${formatPercent(cached_ratio)} of input tokens came from cache reuse.`,
		`- Durable knowledge capture: ${stored_knowledge_posts} knowledge-oriented posts were stored (${content_split}).`,
		top_session
			? `- Dominant session: ${top_session.title} carried ${top_session.message_count} messages.`
			: '- Dominant session: conversation volume stayed distributed across sessions.',
		top_project
			? `- Dominant project: ${top_project.name} concentrated ${top_project.message_count} messages across ${top_project.session_count} sessions.`
			: '- Dominant project: no single project became clearly dominant in this window.',
		`- Pipeline pressure: ${analytics.ops.backlog_pending} pending items remain, with ${analytics.linkcase.pending_links} link(s) still waiting and ${analytics.ops.unread_notifications} unread notification(s).`
	].join('\n')
}

export const buildReportAnalysisMarkdown = (args: { analytics: ReportAnalytics; topics: ReportTopicSummary }) => {
	const { analytics, topics } = args
	const model_lines =
		analytics.usage.models.length > 0
			? analytics.usage.models.map(
					item =>
						`- ${item.label} · ${item.calls} calls · ${formatCompactNumber(item.total_tokens)} tokens`
				)
			: ['- No assistant usage telemetry was recorded in this window.']
	const provider_lines =
		analytics.usage.providers.length > 0
			? analytics.usage.providers.map(
					item =>
						`- ${item.provider} · ${item.calls} calls · ${formatCompactNumber(item.total_tokens)} tokens`
				)
			: ['- No provider distribution was recorded in this window.']
	const top_session_lines =
		analytics.sessions.top_sessions.length > 0
			? analytics.sessions.top_sessions.map(
					item =>
						`- ${item.title} · ${item.message_count} messages · last activity ${formatReportTime(item.last_message_at)}`
				)
			: ['- No active sessions were detected in this window.']
	const top_project_lines =
		analytics.sessions.top_projects.length > 0
			? analytics.sessions.top_projects.map(
					item =>
						`- ${item.name} · ${item.message_count} messages across ${item.session_count} sessions`
				)
			: ['- No project-specific concentration stood out in this window.']
	const agent_lines =
		analytics.knowledge.top_agent_changes.length > 0
			? analytics.knowledge.top_agent_changes.map(
					item =>
						`- ${item.name} · ${item.new_sessions} new sessions · ${item.new_articles} new linked articles · ${item.new_memory_posts} memory posts · ${item.new_wiki_posts} wiki posts`
				)
			: ['- No material agent-linked content shift stood out in this window.']
	const post_lines =
		analytics.content.recent_posts.length > 0
			? analytics.content.recent_posts.map(
					item =>
						`- ${item.title} · ${item.for_type} · updated ${formatReportTime(item.updated_at)}`
				)
			: ['- No recent post updates were captured in this window.']
	const im_lines =
		topics.im_focus.length > 0
			? topics.im_focus.map(item => `- ${item}`)
			: analytics.sessions.top_im_sessions.length > 0
				? analytics.sessions.top_im_sessions.map(
						item => `- ${item.title} · ${item.message_count} IM messages in this window`
					)
				: ['- No notable IM conversation cluster was detected.']

	return [
		'### Executive Summary',
		topics.overview,
		'',
		'### Conversation Themes',
		...topics.themes.map(item => `- ${item}`),
		'',
		'### Learning Signals',
		...topics.learnings.map(item => `- ${item}`),
		'',
		'### Recommendations',
		...topics.advice.map(item => `- ${item}`),
		'',
		'### IM Activity',
		...im_lines,
		'',
		'### Model Mix',
		...model_lines,
		'',
		'### Provider Mix',
		...provider_lines,
		'',
		'### Active Sessions',
		...top_session_lines,
		'',
		'### Active Projects',
		...top_project_lines,
		'',
		'### Agent and Knowledge Changes',
		`- Stored knowledge: +${analytics.knowledge.new_nodes} nodes, +${analytics.knowledge.new_edges} edges, ${analytics.knowledge.new_agent_articles} new agent-linked article relations`,
		`- Memory graph posture: ${analytics.knowledge.active_edges} active edges · ${analytics.knowledge.silent_edges} silent edges · ${analytics.knowledge.unstable_edges} unstable edges`,
		...agent_lines,
		'',
		'### Linkcase and Pipeline',
		`- Added ${analytics.linkcase.new_links} new links in this window.`,
		`- Processed ${analytics.linkcase.processed_links} link(s) into extracted content.`,
		`- ${analytics.linkcase.ready_to_extract} link(s) are ready for extract and ${analytics.linkcase.pending_links} remain pending.`,
		`- ${analytics.ops.backlog_pending} total items are still waiting in the broader pipeline.`,
		'',
		'### Recent Durable Content',
		...post_lines
	]
		.filter(Boolean)
		.join('\n')
}

export const buildReportMarkdown = (args: {
	analytics: ReportAnalytics
	topics: ReportTopicSummary
	incremental: boolean
}) =>
	[
		buildReportPreamble({ analytics: args.analytics, incremental: args.incremental }),
		buildReportMetricsMarkdown({ analytics: args.analytics }),
		buildReportAnalysisMarkdown({ analytics: args.analytics, topics: args.topics })
	]
		.filter(Boolean)
		.join('\n\n')
