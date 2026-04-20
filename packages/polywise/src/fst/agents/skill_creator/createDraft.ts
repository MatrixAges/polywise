import { createSkillCreatorAgent } from '@core/fst/agents/skill_creator'

import type Session from '../../session'
import type { ComplexitySignal, FailureTelemetryRecord, SkillCreatorDraft } from '../superego/types'
import type { SkillCreatorAgentOutput } from './agent'

const getPrompt = (args: {
	conversation: string
	complexity_signal: ComplexitySignal
	failure_telemetry: FailureTelemetryRecord | null
	related_failures: Array<string>
	related_skill: string
}) => {
	const { conversation, complexity_signal, failure_telemetry, related_failures, related_skill } = args

	return [
		'Create a skill draft only if the workflow is reusable.',
		'',
		'## Complexity Signal',
		JSON.stringify(complexity_signal, null, 2),
		'',
		'## Failure Telemetry',
		failure_telemetry ? JSON.stringify(failure_telemetry, null, 2) : 'null',
		'',
		'## Related Failure Cases',
		related_failures.length > 0 ? related_failures.join('\n') : 'None',
		'',
		'## Related Skill Content',
		related_skill || 'None',
		'',
		'## Conversation Fragment',
		conversation
	].join('\n')
}

export default async (args: {
	session: Session
	conversation: string
	complexity_signal: ComplexitySignal
	failure_telemetry: FailureTelemetryRecord | null
	related_failures: Array<string>
	related_skill: string
}) => {
	const { session, conversation, complexity_signal, failure_telemetry, related_failures, related_skill } = args
	const agent = createSkillCreatorAgent(session.model.model)
	const res = await agent.generate({
		prompt: getPrompt({
			conversation,
			complexity_signal,
			failure_telemetry,
			related_failures,
			related_skill
		})
	})

	const output = res.output as SkillCreatorAgentOutput | undefined

	return {
		action: output?.action || 'skip',
		reason: output?.reason || 'no skill draft produced',
		name: output?.name || '',
		description: output?.description || '',
		keywords: Array.isArray(output?.keywords) ? output?.keywords : [],
		content: output?.content || ''
	} as SkillCreatorDraft
}
