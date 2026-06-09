import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { generateText, Output } from 'ai'
import dayjs from 'dayjs'
import { pick } from 'es-toolkit'
import { z } from 'zod'

import getProviderRuntimeName from '../utils/getProviderRuntimeName'

import type { SpecialProvider } from '@core/types'
import type { PthinkConfig, PthinkDraftReview, PthinkReviewWindow } from './types'

const article_schema = z.object({
	title: z.string(),
	for_type: z.enum(['memory', 'wiki']),
	content: z.string(),
	confidence: z.number().min(0).max(1),
	reason: z.string()
})

const skill_schema = z.object({
	action: z.enum(['skip', 'create', 'update']),
	name: z.string(),
	description: z.string(),
	content: z.string(),
	keywords: z.array(z.string()).max(8),
	confidence: z.number().min(0).max(1),
	reason: z.string()
})

const tool_schema = z.object({
	action: z.enum(['skip', 'create']),
	name: z.string(),
	description: z.string(),
	readme: z.string(),
	entry: z.string(),
	input_schema: z.string().optional(),
	output_schema: z.string().optional(),
	confidence: z.number().min(0).max(1),
	reason: z.string()
})

const synthesis_schema = z.object({
	title: z.string(),
	summary: z.string(),
	articles: z.array(article_schema).max(4),
	skill: skill_schema.nullable(),
	tool: tool_schema.nullable()
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

const getFallback = (window: PthinkReviewWindow): PthinkDraftReview => ({
	title: `Post-Think Review · ${dayjs(window.end_at).format('YYYY-MM-DD HH:mm')}`,
	summary: `Reviewed ${window.message_count} messages across ${window.session_count} sessions.`,
	articles: [],
	skill: null,
	tool: null
})

export const synthesizePthinkReview = async (args: { window: PthinkReviewWindow; config: PthinkConfig }) => {
	const fallback = getFallback(args.window)

	try {
		const { model, provider_options } = await resolveDefaultTextModel()
		const { output } = await generateText({
			model,
			system: [
				'You are the post-think synthesizer for a local workspace.',
				'Read only the supplied message content and extract durable value from the reviewed messages.',
				'Articles must contain reusable knowledge, decisions, memory, or operating knowledge worth keeping.',
				'Create a skill only when the reviewed messages reveal a reusable execution pattern, debugging pattern, or recovery workflow that clearly generalizes beyond this one session.',
				'Skill drafts must be conservative, abstract away session-specific details, and use the exact sections Trigger Conditions, Numbered Steps, Pitfalls, Verification Steps, and Generalization Notes.',
				'Create a tool only when the reviewed messages reveal a fixed, frequent, short, and programmatic workflow that should be automated as a tiny deterministic utility.',
				'Do not propose a tool for open-ended research, long coding tasks, complex judgment, or one-off project work.',
				'Do not use tool creation just because code can be written. The workflow itself must be stable and worth repeating.',
				'If skill or tool evidence is weak, return skip.',
				'Do not restate chat. Compress it into durable artifacts.'
			].join(' '),
			prompt: JSON.stringify(
				{
					now: dayjs(args.window.end_at).format('YYYY-MM-DD HH:mm:ss'),
					review_policy: {
						max_articles: args.config.max_articles_per_run,
						skill_generation_enabled: args.config.skill_generation_enabled,
						tool_generation_enabled: args.config.tool_generation_enabled,
						skill_threshold: 'very high',
						tool_threshold: 'extremely high',
						skill_requirements: [
							'multiple meaningful steps',
							'future reusability',
							'clear generalization beyond this session',
							'not just an answer but a reusable way of operating'
						],
						tool_requirements: [
							'fixed and short workflow',
							'frequent or obviously recurring',
							'deterministic enough to automate',
							'minimal human judgment'
						]
					},
					window: {
						start_at: args.window.start_at,
						end_at: args.window.end_at,
						message_count: args.window.message_count,
						session_count: args.window.session_count
					},
					messages: args.window.messages.map(item => ({
						session: item.session_title || 'Untitled',
						role: item.role,
						at: dayjs(item.created_at).format('HH:mm:ss'),
						text: item.text
					}))
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
			articles: result.articles
				.map(item => ({
					...item,
					title: item.title.trim(),
					content: item.content.trim(),
					reason: item.reason.trim()
				}))
				.filter(item => item.title && item.content),
			skill: result.skill
				? {
						...result.skill,
						name: result.skill.name.trim(),
						description: result.skill.description.trim(),
						content: result.skill.content.trim(),
						reason: result.skill.reason.trim(),
						keywords: result.skill.keywords.map(item => item.trim()).filter(Boolean)
					}
				: null,
			tool: result.tool
				? {
						...result.tool,
						name: result.tool.name.trim(),
						description: result.tool.description.trim(),
						readme: result.tool.readme.trim(),
						entry: result.tool.entry.trim(),
						input_schema: result.tool.input_schema?.trim(),
						output_schema: result.tool.output_schema?.trim(),
						reason: result.tool.reason.trim()
					}
				: null
		} satisfies PthinkDraftReview
	} catch {
		return fallback
	}
}
