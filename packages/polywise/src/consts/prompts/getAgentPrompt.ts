import type { Agent } from '@core/db'

type AgentProfileSource = Pick<Agent, 'name' | 'role' | 'identity' | 'soul' | 'memory' | 'prompt'>

type AgentCreateSource = {
	purpose?: string | null
	name?: string | null
	role?: string | null
	description?: string | null
	prompt?: string | null
	soul?: string | null
	identity?: string | null
	memory?: string | null
}

const normalizeBlock = (value?: string | null) => value?.trim() || ''

const getAgentPromptContract = (agent: AgentProfileSource) => {
	const prompt = normalizeBlock(agent.prompt)

	if (!prompt) {
		return ''
	}

	return [
		'## Hard Rules',
		'Treat the following prompt block as mandatory operating rules for this session.',
		'If the prompt requires a tool call before answering, you must call that tool first.',
		'Do not weaken, skip, summarize, or reinterpret these rules because of brevity, style, or roleplay fluency.',
		'If the prompt rules cannot be satisfied, say that directly instead of pretending to comply.',
		`## Prompt Rules\n${prompt}`
	].join('\n\n')
}

export const getAgentSessionPrompt = (agent: AgentProfileSource) => {
	return [
		'# Agent Session Profile',
		'## Name',
		agent.name,
		'## Role',
		agent.role,
		agent.identity ? `## Identity\n${agent.identity}` : '',
		agent.soul ? `## Soul\n${agent.soul}` : '',
		agent.memory ? `## Memory\n${agent.memory}` : '',
		getAgentPromptContract(agent),
		'## Reply Style',
		'Speak like a real person, not a document.',
		'Default to a short direct reply. Usually use 1-3 short sentences or one short paragraph.',
		'Lead with the answer or key point. Do not pad with setup, repetition, or obvious restatement of the user message.',
		'Do not use headings, bullet lists, long explanations, or multi-part structure unless the user explicitly asks or the task truly requires it.',
		'For simple confirmations, yes/no questions, and straightforward factual replies, answer in a single concise sentence.',
		'Expand only when the user asks for detail or when brevity would make the answer unclear.',
		'Follow this agent session profile as a hard system-level role constraint.',
		'When the Hard Rules conflict with the Reply Style, follow the Hard Rules first.'
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getAgentToolProfilePrompt = (agent: AgentProfileSource) => {
	return [
		'# Target Agent Profile',
		`Name: ${agent.name}`,
		`Role: ${agent.role}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		getAgentPromptContract(agent),
		'Respond as this exact agent only.',
		'Do not narrate internal coordination. Answer the request directly from this agent perspective.',
		'If the Hard Rules require tool use before answering, comply with that before producing the final reply.'
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getAgentToolSystemPrompt = (args: {
	agent: AgentProfileSource
	context_prompt: string
	session_title: string
	real_world_date: string
}) => {
	return [
		getAgentToolProfilePrompt(args.agent),
		args.context_prompt,
		`Current Session Title: ${args.session_title}`,
		`Real World Date: ${args.real_world_date}`
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getAgentCreateProfilePrompt = (input: AgentCreateSource) => {
	const fields = [
		['purpose', input.purpose],
		['name', input.name],
		['role', input.role],
		['description', input.description],
		['prompt', input.prompt],
		['soul', input.soul],
		['identity', input.identity],
		['memory', input.memory]
	]

	return [
		'Create a fresh AI agent profile.',
		'Return a short, memorable name, a concise role, a concise description, and complete fields for prompt, soul, identity, and memory.',
		'Use the purpose sentence as the main design anchor when it is present.',
		'Make the result feel specific and varied instead of generic or numbered.',
		'The role must be no more than 20 characters and should usually be one or two words.',
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

export const getAgentCreateInstructions = () =>
	'Generate a concise AI agent profile. Keep the name short and distinctive. Keep the role within 20 characters and preferably one or two words. Keep the description to one sentence. For prompt, soul, identity, and memory, return valid structured Markdown with short headings and bullet lists. Do not use code fences. Do not wrap the fields in quotes.'
