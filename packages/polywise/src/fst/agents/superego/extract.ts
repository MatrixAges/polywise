import path from 'path'
import { app } from '@core/consts'
import { convertToModelMessages } from 'ai'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import { collectFailureEvent, PatchRecord, searchFailureCases } from '../../telemetry'
import executeSkillTool from '../../tools/skill/execute'
import createSkillDraft from '../skill_creator/createDraft'
import createSuperegoAgent from './agent'

import type Session from '../../session'
import type { SuperegoAgentOutput } from './agent'
import type { ComplexitySignal, SuperegoResult } from './types'

const superego_dir = path.resolve(app.app_path, 'superego')

const appendSuperegoLog = async (args: { session_id: string; result: SuperegoResult }) => {
	const { session_id, result } = args

	await fs.ensureDir(superego_dir)

	const file_name = `${dayjs().format('YYYY-MM-DD')}.jsonl`
	const file_path = path.resolve(superego_dir, file_name)

	await fs.appendFile(
		file_path,
		JSON.stringify({
			session_id,
			timestamp: Date.now(),
			result
		}) + '\n',
		'utf8'
	)
}

const noise_patterns = [
	/Called the [A-Za-z]+ tool with the following input:/i,
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

const normalizeConversationContent = (value: string) => {
	const normalized_value = stripNoise(value)

	return normalized_value.replace(/\s+/g, ' ').trim()
}

const getConversationFragment = async (s: Session) => {
	const model_messages = await convertToModelMessages(s.model_messages)

	return model_messages
		.map(message => {
			const raw_content =
				typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
			const content = normalizeConversationContent(raw_content)

			if (!content) {
				return ''
			}

			return `[${message.role}]: ${content}`
		})
		.filter(Boolean)
		.join('\n\n')
}

const getSuperegoPrompt = (conversation: string) => {
	return [
		'Analyze the conversation fragment below.',
		'Apply the learning loop defined in your system instructions.',
		'Only store durable value.',
		'For skills, prefer search -> read -> create or update when a reusable workflow exists.',
		'If the complexity signal says the task is not complex, be conservative about skill creation.',
		'',
		'---',
		'',
		conversation
	].join('\n')
}

const getSuperegoResult = (
	output: SuperegoAgentOutput | undefined,
	args?: {
		complexity_signal?: ComplexitySignal
		failure_telemetry?: PatchRecord | null
		skill_draft?: SuperegoResult['skill_draft']
	}
): SuperegoResult => {
	const target = args || {}

	if (output) {
		return {
			summary: output.summary || 'completed',
			actions: Array.isArray(output.actions) ? output.actions : [],
			complexity_signal: target.complexity_signal,
			failure_telemetry: target.failure_telemetry ?? null,
			skill_draft: target.skill_draft ?? null
		}
	}

	return {
		summary: 'skipped',
		actions: [],
		complexity_signal: target.complexity_signal,
		failure_telemetry: target.failure_telemetry ?? null,
		skill_draft: target.skill_draft ?? null
	}
}

const getFailureTarget = (conversation: string, complexity_signal: ComplexitySignal) => {
	if (complexity_signal.has_error_pattern) {
		return 'tool failure recovery workflow'
	}

	if (complexity_signal.is_complex) {
		return 'complex multi-step workflow'
	}

	return conversation.slice(0, 120) || 'conversation fragment'
}

const getFailureKeywords = (conversation: string, complexity_signal: ComplexitySignal) => {
	const base = [] as Array<string>

	if (complexity_signal.has_error_pattern) {
		base.push('error', 'failure', 'retry')
	}

	if (complexity_signal.is_complex) {
		base.push('complex workflow', 'multi-step task')
	}

	return Array.from(
		new Set([
			...base,
			...conversation
				.toLowerCase()
				.split(/[^a-z0-9]+/)
				.filter(Boolean)
				.slice(0, 8)
		])
	)
		.filter(Boolean)
		.slice(0, 12)
}

export default async (s: Session, complexity_signal?: ComplexitySignal) => {
	if (s.superego_append_count < 3) return

	s.superego_append_count = 0

	const scope = s.scope
	const conversation = await getConversationFragment(s)

	const agent = createSuperegoAgent(s.model.model, s, scope)

	try {
		const result = await agent.generate({ prompt: getSuperegoPrompt(conversation) })
		const base_result = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, {
			complexity_signal
		})
		let failure_telemetry = null as PatchRecord | null
		let skill_draft = null as SuperegoResult['skill_draft']

		if (complexity_signal?.is_complex) {
			const failure_target = getFailureTarget(conversation, complexity_signal)
			const failure_keywords = getFailureKeywords(conversation, complexity_signal)
			const similar_skills = await executeSkillTool(s, {
				action: 'search',
				keyword: failure_keywords.join(' '),
				max_results: 1
			})

			let related_skill = ''
			let related_skill_name = ''
			let related_skill_score = 0

			if (
				similar_skills &&
				typeof similar_skills === 'object' &&
				'results' in similar_skills &&
				Array.isArray(similar_skills.results) &&
				similar_skills.results.length > 0
			) {
				related_skill_name = String(similar_skills.results[0]?.name || '')
				related_skill_score = Number(similar_skills.results[0]?.score || 0)

				const read_result = await executeSkillTool(s, {
					action: 'read',
					skill_name: related_skill_name
				})

				if (read_result && typeof read_result === 'object' && 'content' in read_result) {
					related_skill = String(read_result.content || '')
				}
			}

			if (complexity_signal.has_error_pattern || complexity_signal.has_retry_pattern) {
				failure_telemetry = await collectFailureEvent({
					app_path: app.app_path,
					session_id: s.id,
					tool_name: 'superego',
					target: failure_target,
					error_text: base_result.summary,
					keywords: failure_keywords,
					has_existing_skill: Boolean(related_skill_name)
				})
			}

			const related_failures = await searchFailureCases({
				app_path: app.app_path,
				tool_name: 'superego',
				keywords: failure_keywords,
				max_count: 5
			})

			skill_draft = await createSkillDraft({
				session: s,
				conversation,
				complexity_signal,
				failure_telemetry,
				related_failures,
				related_skill_name,
				related_skill_score,
				related_skill,
				patch_priority: failure_telemetry?.suggestion.level || 'observe',
				existing_skill_preferred_action: failure_telemetry?.suggestion.suggested_action || 'observe'
			})

			if (skill_draft.action === 'create' && skill_draft.name && skill_draft.content) {
				await executeSkillTool(s, {
					action: 'create',
					build_name: skill_draft.name,
					build_description: skill_draft.description,
					build_content: skill_draft.content
				})

				base_result.actions.push({
					tool: 'skill_tool',
					action: 'create',
					target: skill_draft.name
				})
			}

			if (
				skill_draft.action === 'update' &&
				(related_skill_name || skill_draft.name) &&
				skill_draft.content
			) {
				await executeSkillTool(s, {
					action: 'update',
					skill_name: related_skill_name || skill_draft.name,
					build_description: skill_draft.description,
					build_content: skill_draft.content
				})

				base_result.actions.push({
					tool: 'skill_tool',
					action: 'update',
					target: related_skill_name || skill_draft.name
				})
			}
		}

		const parsed = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, {
			complexity_signal,
			failure_telemetry,
			skill_draft
		})
		parsed.actions = base_result.actions
		parsed.summary = base_result.summary

		await appendSuperegoLog({ session_id: s.id, result: parsed })
	} catch {
		await appendSuperegoLog({
			session_id: s.id,
			result: { summary: 'error', actions: [], complexity_signal }
		})
	}
}
