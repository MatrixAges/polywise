import { agent_create_input_schema } from '@core/db/schemas'
import { addAgent, getAgents, normalizeAgentModel } from '@core/db/services'
import { getDefaultToolModel, runToolAgent } from '@core/fst/agents'
import { p } from '@core/utils'
import { infer as Infer, object, string } from 'zod'

const input_type = agent_create_input_schema
type AgentCreateInput = Infer<typeof input_type>

const generated_agent_schema = object({
	name: string().describe('A short, distinctive agent name'),
	description: string().describe('A concise one-sentence description of the agent focus')
})

const normalizeText = (value?: string | null) => value?.trim().replace(/\s+/g, ' ') || ''

const getFallbackAgentProfile = async () => {
	const agent_items = await getAgents()

	return {
		name: `Agent ${agent_items.length + 1}`,
		description: 'A flexible AI assistant for planning, writing, and everyday problem solving.'
	}
}

const getAgentProfilePrompt = (input: AgentCreateInput) => {
	const fields = [
		['prompt', input.prompt],
		['soul', input.soul],
		['identity', input.identity],
		['memory', input.memory]
	]

	return [
		'Create a fresh AI agent profile.',
		'Return a short, memorable name and a concise description.',
		'Make the result feel specific and varied instead of generic or numbered.',
		'Use the same language as the most informative source text. If the source is mostly empty, respond in English.',
		'Source fields:',
		...fields.map(([label, value]) => `${label}: ${normalizeText(value) || '(empty)'}`)
	].join('\n')
}

export default p.input(input_type).mutation(async ({ input }) => {
	const fallback_profile = await getFallbackAgentProfile()
	let generated_profile = null as { name?: string; description?: string } | null

	try {
		const model = await getDefaultToolModel()

		generated_profile = await runToolAgent({
			model,
			schema: generated_agent_schema,
			prompt: getAgentProfilePrompt(input),
			instructions:
				'Generate a concise AI agent profile. Keep the name short and distinctive. Keep the description to one sentence. Do not include markdown, quotes, or numbering.'
		})
	} catch {}

	const name = normalizeText(input.name) || normalizeText(generated_profile?.name) || fallback_profile.name
	const description =
		normalizeText(input.description) ||
		normalizeText(generated_profile?.description) ||
		fallback_profile.description

	return addAgent({
		...input,
		name,
		description,
		model: normalizeAgentModel(input.model),
		order: Date.now()
	})
})
