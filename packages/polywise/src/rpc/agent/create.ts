import { agent_create_input_schema } from '@core/db/schemas'
import { addAgent, getAgents, normalizeAgentModel } from '@core/db/services'
import { getDefaultToolModel, runToolAgent } from '@core/fst/agents'
import { p } from '@core/utils'
import { object, string } from 'zod'

import { getAgentCreateInstructions, getAgentCreateProfilePrompt } from '../../consts/prompts/getAgentPrompt'
import { readPinList } from './utils'

const input_type = agent_create_input_schema

const generated_agent_schema = object({
	name: string().describe('A short, distinctive agent name'),
	role: string().describe('A concise role label, ideally one or two words and no more than 20 characters'),
	description: string().describe('A concise one-sentence description of the agent focus'),
	prompt: string().describe('The core instruction prompt that defines how the agent should respond'),
	soul: string().describe('The tone, temperament, and internal style of the agent'),
	identity: string().describe('Who the agent is, its role, expertise, and point of view'),
	memory: string().describe('Key standing context or durable knowledge the agent should keep in mind')
})

const normalizeSingleLine = (value?: string | null) => value?.trim().replace(/\s+/g, ' ') || ''
const normalizeBlock = (value?: string | null) => value?.trim() || ''
const normalizeRole = (value?: string | null) => {
	const next_value = normalizeSingleLine(value)

	return next_value && next_value.length <= 20 ? next_value : ''
}

const getFallbackAgentProfile = async () => {
	const agent_items = await getAgents()

	return {
		name: `Agent ${agent_items.length + 1}`,
		role: 'Assistant',
		description: 'A flexible AI assistant for planning, writing, and everyday problem solving.',
		prompt: [
			'## Mission',
			'- Help the user solve problems clearly and efficiently.',
			'## Operating Rules',
			'- Ask only when needed.',
			'- Stay practical and provide concrete next steps.'
		].join('\n'),
		soul: [
			'## Tone',
			'- Calm',
			'- Pragmatic',
			'- Precise',
			'- Collaborative',
			'## Style',
			'- Prefer clarity over flourish.',
			'- Stay direct without sounding cold.'
		].join('\n'),
		identity: [
			'## Role',
			'- A general-purpose AI agent for execution, analysis, and structured communication.',
			'## Strengths',
			'- Planning',
			'- Writing',
			'- Problem solving'
		].join('\n'),
		memory: [
			'## Standing Context',
			'- Prioritize clarity.',
			'- Preserve relevant context.',
			'- Adapt to the user task at hand.',
			'## Defaults',
			'- Prefer actionable output.',
			'- Avoid unnecessary questions.'
		].join('\n')
	}
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/create',
			summary: 'Run Create'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const fallback_profile = await getFallbackAgentProfile()
		let generated_profile = null as {
			name?: string
			role?: string
			description?: string
			prompt?: string
			soul?: string
			identity?: string
			memory?: string
		} | null

		try {
			const model = await getDefaultToolModel()

			generated_profile = await runToolAgent({
				model,
				schema: generated_agent_schema,
				prompt: getAgentCreateProfilePrompt(input),
				instructions: getAgentCreateInstructions()
			})
		} catch {}

		const name =
			normalizeSingleLine(input.name) ||
			normalizeSingleLine(generated_profile?.name) ||
			fallback_profile.name
		const role = normalizeRole(input.role) || normalizeRole(generated_profile?.role) || fallback_profile.role
		const description =
			normalizeSingleLine(input.description) ||
			normalizeSingleLine(generated_profile?.description) ||
			fallback_profile.description
		const prompt =
			normalizeBlock(input.prompt) || normalizeBlock(generated_profile?.prompt) || fallback_profile.prompt
		const soul = normalizeBlock(input.soul) || normalizeBlock(generated_profile?.soul) || fallback_profile.soul
		const identity =
			normalizeBlock(input.identity) ||
			normalizeBlock(generated_profile?.identity) ||
			fallback_profile.identity
		const memory =
			normalizeBlock(input.memory) || normalizeBlock(generated_profile?.memory) || fallback_profile.memory

		const next_agent = await addAgent({
			...input,
			name,
			role,
			description,
			prompt,
			soul,
			identity,
			memory,
			model: normalizeAgentModel(input.model),
			order: Date.now()
		})

		if (next_agent?.id) {
			await readPinList(next_agent.id)
		}

		return next_agent
	})
