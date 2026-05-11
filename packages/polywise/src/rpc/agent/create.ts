import { agent_create_input_schema } from '@core/db/schemas'
import { addAgent, getAgents, normalizeAgentModel } from '@core/db/services'
import { getDefaultToolModel, runToolAgent } from '@core/fst/agents'
import { p } from '@core/utils'
import { infer as Infer, object, string } from 'zod'

import { readPinList } from './utils'

const input_type = agent_create_input_schema
type AgentCreateInput = Infer<typeof input_type>

const generated_agent_schema = object({
	name: string().describe('A short, distinctive agent name'),
	description: string().describe('A concise one-sentence description of the agent focus'),
	prompt: string().describe('The core instruction prompt that defines how the agent should respond'),
	soul: string().describe('The tone, temperament, and internal style of the agent'),
	identity: string().describe('Who the agent is, its role, expertise, and point of view'),
	memory: string().describe('Key standing context or durable knowledge the agent should keep in mind')
})

const normalizeSingleLine = (value?: string | null) => value?.trim().replace(/\s+/g, ' ') || ''
const normalizeBlock = (value?: string | null) => value?.trim() || ''

const getFallbackAgentProfile = async () => {
	const agent_items = await getAgents()

	return {
		name: `Agent ${agent_items.length + 1}`,
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

const getAgentProfilePrompt = (input: AgentCreateInput) => {
	const fields = [
		['purpose', input.purpose],
		['name', input.name],
		['description', input.description],
		['prompt', input.prompt],
		['soul', input.soul],
		['identity', input.identity],
		['memory', input.memory]
	]

	return [
		'Create a fresh AI agent profile.',
		'Return a short, memorable name, a concise description, and complete fields for prompt, soul, identity, and memory.',
		'Use the purpose sentence as the main design anchor when it is present.',
		'Make the result feel specific and varied instead of generic or numbered.',
		'The prompt should be directly usable as the agent system prompt.',
		'The soul should capture tone and temperament.',
		'The identity should define role and expertise.',
		'The memory should contain durable standing context, not a transcript.',
		'Prompt, soul, identity, and memory must each be structured Markdown, not a wall of prose.',
		'Use short headings and bullet lists. Keep sections compact and directly usable.',
		'Do not use code fences.',
		'Use the same language as the most informative source text. If the source is mostly empty, respond in English.',
		'Source fields:',
		...fields.map(([label, value]) => `${label}: ${normalizeBlock(value) || '(empty)'}`)
	].join('\n')
}

export default p.input(input_type).mutation(async ({ input }) => {
	const fallback_profile = await getFallbackAgentProfile()
	let generated_profile = null as {
		name?: string
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
			prompt: getAgentProfilePrompt(input),
			instructions:
				'Generate a concise AI agent profile. Keep the name short and distinctive. Keep the description to one sentence. For prompt, soul, identity, and memory, return valid structured Markdown with short headings and bullet lists. Do not use code fences. Do not wrap the fields in quotes.'
		})
	} catch {}

	const name =
		normalizeSingleLine(input.name) || normalizeSingleLine(generated_profile?.name) || fallback_profile.name
	const description =
		normalizeSingleLine(input.description) ||
		normalizeSingleLine(generated_profile?.description) ||
		fallback_profile.description
	const prompt =
		normalizeBlock(input.prompt) || normalizeBlock(generated_profile?.prompt) || fallback_profile.prompt
	const soul = normalizeBlock(input.soul) || normalizeBlock(generated_profile?.soul) || fallback_profile.soul
	const identity =
		normalizeBlock(input.identity) || normalizeBlock(generated_profile?.identity) || fallback_profile.identity
	const memory =
		normalizeBlock(input.memory) || normalizeBlock(generated_profile?.memory) || fallback_profile.memory

	const next_agent = await addAgent({
		...input,
		name,
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
