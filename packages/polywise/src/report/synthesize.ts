import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { generateText, Output } from 'ai'
import dayjs from 'dayjs'
import { pick } from 'es-toolkit'
import { z } from 'zod'

import getProviderRuntimeName from '../utils/getProviderRuntimeName'
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

const report_voice_instruction = [
	'Write in plain English, like a sharp teammate explaining what actually happened.',
	'Read the concrete message content, session titles, IM snippets, and post titles in the input before writing.',
	'Do not produce a dashboard-like list of metrics or simply restate labels from the input.',
	'Name the real topics, problems, ideas, and decisions that show up in the content.',
	'Explain why the work mattered, what changed in understanding, and what should happen next.'
].join(' ')

const resolveDefaultTextModel = async () => {
	const target_config = config.default_model
	const { provider, model, effort } = target_config
	const custom_list = providers.custom_providers ?? []
	const managed_list = providers.managed_providers ?? []
	const found_provider = [...providers.providers, ...custom_list, ...managed_list].find(
		item => item.name === provider
	)
	const target_options = found_provider
		? {
				...pick(found_provider, ['apiKey', 'baseURL']),
				...(found_provider as SpecialProvider).custom_fields
			}
		: undefined
	const provider_name = getProviderRuntimeName({
		provider_name: provider,
		provider_item: found_provider,
		custom_provider_names: custom_list.map(item => item.name)
	})

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

const joinSentenceList = (items: Array<string>, fallback = '') => {
	const cleaned = items
		.map(item =>
			item
				.trim()
				.replace(/^[\-\d\.\s]+/, '')
				.replace(/\s+/g, ' ')
		)
		.filter(Boolean)
		.map(item => (/[.!?]$/.test(item) ? item : `${item}.`))

	if (cleaned.length === 0) {
		return fallback
	}

	return cleaned.join(' ')
}

const toNaturalTopList = (items: Array<string>) => {
	if (items.length === 0) {
		return ''
	}

	if (items.length === 1) {
		return items[0] || ''
	}

	if (items.length === 2) {
		return `${items[0]} and ${items[1]}`
	}

	return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

const buildFallbackTopicSummary = (analytics: ReportAnalytics): ReportTopicSummary => {
	const day_or_window = analytics.window.period === 'day' ? 'day' : analytics.window.period
	const top_session = analytics.sessions.top_sessions[0]
	const top_project = analytics.sessions.top_projects[0]
	const top_im = analytics.sessions.top_im_sessions[0]

	return {
		overview: `This ${day_or_window} mostly revolved around ${top_session?.title || 'a broad mix of sessions'}, with ${analytics.usage.message_count} messages and ${formatCompactNumber(analytics.usage.total_tokens)} tokens moving through the workspace. The work was not just busywork: it also produced ${analytics.content.new_posts} new posts and ${analytics.sessions.new_sessions} new sessions, so ideas were still turning into durable artifacts.`,
		themes: [
			top_session
				? `A lot of the attention stayed on ${top_session.title}, which acted as the main working thread rather than background noise.`
				: 'Attention moved across several threads instead of collapsing into one dominant conversation.',
			top_project
				? `${top_project.name} was the clearest project anchor, so the work had a visible center of gravity.`
				: 'The work did not strongly cluster around a single project, which suggests either exploration or fragmented execution.',
			analytics.content.new_wiki_posts + analytics.content.new_memory_posts > 0
				? `Knowledge capture stayed alive instead of stopping at chat, with ${analytics.content.new_wiki_posts} wiki posts and ${analytics.content.new_memory_posts} memory posts recorded.`
				: 'A fair amount of understanding may still be trapped in conversations because knowledge capture lagged behind the discussion volume.'
		],
		learnings: [
			analytics.knowledge.new_nodes > 0 || analytics.knowledge.new_edges > 0
				? `The knowledge graph actually moved, adding ${analytics.knowledge.new_nodes} nodes and ${analytics.knowledge.new_edges} edges, so at least some understanding became structured.`
				: 'Graph growth stayed limited, which usually means the work produced discussion faster than it produced structured knowledge.',
			analytics.linkcase.processed_links > 0
				? `${analytics.linkcase.processed_links} links made it through extraction, so intake was not completely stalled.`
				: 'Link ingestion barely moved, which is a sign that backlog can quietly build even when conversations look productive.'
		],
		advice: [
			analytics.linkcase.ready_to_extract > 0
				? `Clear the ${analytics.linkcase.ready_to_extract} ready-to-extract linkcase items before they become another passive backlog.`
				: 'Turn the strongest sessions into durable notes while the reasoning is still fresh, instead of waiting for a later cleanup pass.',
			analytics.ops.backlog_pending > 0
				? `Reduce the ${analytics.ops.backlog_pending}-item backlog so the next cycle is not spent carrying unfinished context forward.`
				: 'Backlog pressure looks manageable, so the better tradeoff is depth and synthesis quality rather than raw throughput.'
		],
		im_focus: top_im
			? [
					`${top_im.title} was the most active IM thread, which means some of the real context likely lived in direct coordination rather than the main workspace.`
				]
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
			system: `You summarize local AI workspace conversations into English reporting signals. ${report_voice_instruction}`,
			prompt: JSON.stringify(
				{
					period: args.period,
					instructions: [
						'Read the actual conversation text before writing.',
						'Pull out concrete topics, decisions, repeated concerns, and learning moments.',
						'If a theme is vague, it means you did not read deeply enough.',
						'Do not return bullet points that only rename metrics.'
					],
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
			system: `You are merging chunk-level reporting notes into one English summary for a local AI workspace. ${report_voice_instruction}`,
			prompt: JSON.stringify(
				{
					period: args.period,
					instructions: [
						'Do not turn this into a formal report full of metric labels.',
						'Write like someone who actually read the work and can explain what the period was about.',
						'Use the chunk notes plus the workspace context to infer the storyline of the period.'
					],
					window: {
						key: args.analytics.window.key,
						label: args.analytics.window.label,
						start: dayjs(args.analytics.window.start_at).format('YYYY-MM-DD HH:mm:ss'),
						end: dayjs(args.analytics.window.end_at).format('YYYY-MM-DD HH:mm:ss')
					},
					workspace_context: {
						top_sessions: args.analytics.sessions.top_sessions.slice(0, 4).map(item => ({
							title: item.title,
							message_count: item.message_count
						})),
						top_projects: args.analytics.sessions.top_projects.slice(0, 3).map(item => ({
							name: item.name,
							message_count: item.message_count
						})),
						recent_posts: args.analytics.content.recent_posts.slice(0, 5).map(item => ({
							title: item.title,
							for_type: item.for_type
						})),
						metrics: {
							messages: args.analytics.usage.message_count,
							total_tokens: args.analytics.usage.total_tokens,
							new_sessions: args.analytics.sessions.new_sessions,
							new_posts: args.analytics.content.new_posts,
							new_nodes: args.analytics.knowledge.new_nodes,
							new_edges: args.analytics.knowledge.new_edges,
							ready_to_extract: args.analytics.linkcase.ready_to_extract
						}
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
	const narrative_lines = [
		`The workspace moved through ${analytics.usage.message_count} messages and ${formatCompactNumber(analytics.usage.total_tokens)} tokens in this window, with ${analytics.sessions.active_sessions} active sessions and ${analytics.sessions.new_sessions} newly opened ones.`,
		`Knowledge capture produced ${stored_knowledge_posts} knowledge-oriented posts (${content_split}), while the graph changed by +${analytics.knowledge.new_nodes} nodes and +${analytics.knowledge.new_edges} edges.`,
		`Operationally, ${analytics.linkcase.processed_links} links were processed, ${analytics.linkcase.ready_to_extract} are ready to extract, and ${analytics.ops.backlog_pending} items are still sitting in the broader backlog.`
	]

	return [
		'### At a Glance',
		...narrative_lines,
		'',
		'### Reading the Numbers',
		`- ${formatPercent(cached_ratio)} of input tokens came from cache reuse, which suggests how much of the work leaned on already-known context instead of fully new material.`,
		top_session
			? `- The center of gravity was ${top_session.title}, which carried ${top_session.message_count} messages and likely held the main line of reasoning.`
			: '- No single session dominated, so the period looked more exploratory than focused.',
		top_project
			? `- ${top_project.name} was the clearest project anchor, with ${top_project.message_count} messages across ${top_project.session_count} sessions.`
			: '- Project attention stayed spread out, which usually means either discovery work or context switching.',
		`- Pipeline pressure is still real: ${analytics.linkcase.pending_links} links remain pending and ${analytics.ops.unread_notifications} notifications are still unread.`
	].join('\n')
}

export const buildReportAnalysisMarkdown = (args: { analytics: ReportAnalytics; topics: ReportTopicSummary }) => {
	const { analytics, topics } = args
	const top_session_lines = analytics.sessions.top_sessions
		.slice(0, 3)
		.map(item => `${item.title} (${item.message_count} messages)`)
	const top_project_lines = analytics.sessions.top_projects
		.slice(0, 3)
		.map(item => `${item.name} (${item.message_count} messages across ${item.session_count} sessions)`)
	const recent_post_lines = analytics.content.recent_posts
		.slice(0, 4)
		.map(item => `${item.title} (${item.for_type})`)
	const model_items =
		analytics.usage.models.length > 0
			? analytics.usage.models
					.slice(0, 3)
					.map(
						item =>
							`${item.label} (${item.calls} calls, ${formatCompactNumber(item.total_tokens)} tokens)`
					)
			: []
	const im_sentence = joinSentenceList(
		topics.im_focus.length > 0
			? topics.im_focus
			: analytics.sessions.top_im_sessions
					.slice(0, 2)
					.map(item => `${item.title} carried ${item.message_count} IM messages in this window`)
	)
	const learning_paragraph = joinSentenceList(topics.learnings)
	const theme_paragraph = joinSentenceList(topics.themes)
	const advice_lines = topics.advice
		.map(item => item.trim())
		.filter(Boolean)
		.map(item => (/^[0-9]+\./.test(item) ? item : item))
	const model_summary_line =
		analytics.usage.models.length > 0
			? `The heaviest model usage came from ${toNaturalTopList(model_items)}.`
			: 'Model usage telemetry did not surface a meaningful model mix for this window.'
	const knowledge_lines =
		analytics.knowledge.top_agent_changes.length > 0
			? analytics.knowledge.top_agent_changes
					.slice(0, 3)
					.map(
						item =>
							`${item.name} added ${item.new_sessions} new sessions, ${item.new_articles} linked articles, ${item.new_memory_posts} memory posts, and ${item.new_wiki_posts} wiki posts`
					)
			: []

	return [
		'### What Happened',
		topics.overview,
		theme_paragraph,
		'',
		'### Why It Mattered',
		learning_paragraph,
		im_sentence
			? `A meaningful part of the context also lived in IM: ${im_sentence}`
			: 'IM was not a major separate context source in this window.',
		`On the knowledge side, the graph moved by +${analytics.knowledge.new_nodes} nodes, +${analytics.knowledge.new_edges} edges, and ${analytics.knowledge.rewire_events} rewires, while linkcase left ${analytics.linkcase.ready_to_extract} items ready to extract and ${analytics.linkcase.pending_links} still pending.`,
		'',
		'### What To Do Next',
		...advice_lines.map((item, index) => `${index + 1}. ${item.replace(/^[\-\d\.\s]+/, '')}`),
		'',
		'### Supporting Signals',
		top_session_lines.length > 0
			? `- The busiest sessions were ${toNaturalTopList(top_session_lines)}.`
			: '- No session clearly stood out as the main working thread.',
		top_project_lines.length > 0
			? `- The work clustered most around ${toNaturalTopList(top_project_lines)}.`
			: '- Project activity remained fairly spread out.',
		recent_post_lines.length > 0
			? `- Durable output showed up in ${toNaturalTopList(recent_post_lines)}.`
			: '- This window did not leave behind much recent durable content.',
		model_summary_line ? `- ${model_summary_line}` : '',
		knowledge_lines.length > 0
			? `- Agent-linked change was most visible in ${toNaturalTopList(knowledge_lines)}.`
			: '- No single agent dominated the visible knowledge changes.'
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
