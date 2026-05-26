import path from 'path'
import { app } from '@core/consts'
import getSuperegoPrompt from '@core/consts/prompts/getSuperegoPrompt'
import { convertToModelMessages } from 'ai'
import dayjs from 'dayjs'
import fs from 'fs-extra'

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

const getSuperegoResult = (
	output: SuperegoAgentOutput | undefined,
	args?: {
		complexity_signal?: ComplexitySignal
	}
): SuperegoResult => {
	const target = args || {}

	if (output) {
		return {
			summary: output.summary || 'completed',
			actions: Array.isArray(output.actions) ? output.actions : [],
			complexity_signal: target.complexity_signal,
			failure_telemetry: null,
			skill_draft: null
		}
	}

	return {
		summary: 'skipped',
		actions: [],
		complexity_signal: target.complexity_signal,
		failure_telemetry: null,
		skill_draft: null
	}
}

export default async (s: Session, complexity_signal?: ComplexitySignal) => {
	if (s.superego_append_count < 3) return

	s.superego_append_count = 0

	const scope = s.scope
	const conversation = await getConversationFragment(s)

	const agent = createSuperegoAgent(s.model.model, s, scope)

	try {
		const result = await agent.generate({ prompt: getSuperegoPrompt(conversation) })
		const parsed = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, {
			complexity_signal
		})

		await appendSuperegoLog({ session_id: s.id, result: parsed })
	} catch {
		await appendSuperegoLog({
			session_id: s.id,
			result: { summary: 'error', actions: [], complexity_signal }
		})
	}
}
