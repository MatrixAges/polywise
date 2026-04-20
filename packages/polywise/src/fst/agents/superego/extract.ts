import { app } from '@core/consts'
import { convertToModelMessages } from 'ai'

import executeSkillTool from '../../tools/skill/execute'
import createSkillDraft from '../skill_creator/createDraft'
import createSuperegoAgent from './agent'
import recordFailureTelemetry from './recordFailureTelemetry'
import searchFailureTelemetry from './searchFailureTelemetry'

import type Session from '../../session'
import type { SuperegoAgentOutput } from './agent'
import type { ComplexitySignal, FailureTelemetryRecord, SuperegoEvent, SuperegoResult } from './types'

const getConversationFragment = async (s: Session) => {
	const model_messages = await convertToModelMessages(s.model_messages)

	return model_messages
		.map(message => {
			const content =
				typeof message.content === 'string' ? message.content : JSON.stringify(message.content)

			return `[${message.role}]: ${content}`
		})
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
	text: string,
	args?: {
		complexity_signal?: ComplexitySignal
		failure_telemetry?: FailureTelemetryRecord | null
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
		summary: text || 'completed',
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
		const base_result = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, result.text, {
			complexity_signal
		})
		let failure_telemetry = null as FailureTelemetryRecord | null
		let skill_draft = null as SuperegoResult['skill_draft']

		if (complexity_signal?.is_complex) {
			const failure_target = getFailureTarget(conversation, complexity_signal)
			const failure_keywords = getFailureKeywords(conversation, complexity_signal)

			if (complexity_signal.has_error_pattern || complexity_signal.has_retry_pattern) {
				failure_telemetry = await recordFailureTelemetry({
					app_path: app.app_path,
					session_id: s.id,
					tool_name: 'superego',
					error_text: base_result.summary,
					target: failure_target,
					keywords: failure_keywords
				})
			}

			const related_failures = await searchFailureTelemetry({
				app_path: app.app_path,
				tool_name: 'superego',
				keywords: failure_keywords,
				max_count: 5
			})

			const similar_skills = await executeSkillTool(s, {
				action: 'search',
				keyword: failure_keywords.join(' '),
				max_results: 1
			})

			let related_skill = ''
			let related_skill_name = ''

			if (
				similar_skills &&
				typeof similar_skills === 'object' &&
				'results' in similar_skills &&
				Array.isArray(similar_skills.results) &&
				similar_skills.results.length > 0
			) {
				related_skill_name = String(similar_skills.results[0]?.name || '')

				const read_result = await executeSkillTool(s, {
					action: 'read',
					skill_name: related_skill_name
				})

				if (read_result && typeof read_result === 'object' && 'content' in read_result) {
					related_skill = String(read_result.content || '')
				}
			}

			skill_draft = await createSkillDraft({
				session: s,
				conversation,
				complexity_signal,
				failure_telemetry,
				related_failures,
				related_skill
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

		const parsed = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, result.text, {
			complexity_signal,
			failure_telemetry,
			skill_draft
		})
		parsed.actions = base_result.actions
		parsed.summary = base_result.summary

		s.event.emit(`${s.id}/change`, {
			type: 'superego',
			data: { result: JSON.stringify(parsed), timestamp: Date.now() } as SuperegoEvent
		})
	} catch {
		s.event.emit(`${s.id}/change`, {
			type: 'superego',
			data: {
				result: JSON.stringify({ summary: 'error', actions: [] }),
				timestamp: Date.now()
			} as SuperegoEvent
		})
	}
}
