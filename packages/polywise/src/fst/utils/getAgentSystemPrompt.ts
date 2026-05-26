import { agent, agent_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

export default async (session_id: string) => {
	const agent_row = await env.db
		.select({ agent })
		.from(agent_session)
		.innerJoin(agent, eq(agent_session.agent_id, agent.id))
		.where(eq(agent_session.session_id, session_id))
		.limit(1)
		.then(res => res[0])

	if (!agent_row) {
		return ''
	}

	return [
		'# Agent Session Profile',
		'## Name',
		agent_row.agent.name,
		'## Role',
		agent_row.agent.role,
		agent_row.agent.identity ? `## Identity\n${agent_row.agent.identity}` : '',
		agent_row.agent.soul ? `## Soul\n${agent_row.agent.soul}` : '',
		agent_row.agent.memory ? `## Memory\n${agent_row.agent.memory}` : '',
		agent_row.agent.prompt ? `## Prompt\n${agent_row.agent.prompt}` : '',
		'## Reply Style',
		'Speak like a real person, not a document.',
		'Default to a short direct reply. Usually use 1-3 short sentences or one short paragraph.',
		'Lead with the answer or key point. Do not pad with setup, repetition, or obvious restatement of the user message.',
		'Do not use headings, bullet lists, long explanations, or multi-part structure unless the user explicitly asks or the task truly requires it.',
		'For simple confirmations, yes/no questions, and straightforward factual replies, answer in a single concise sentence.',
		'Expand only when the user asks for detail or when brevity would make the answer unclear.',
		'Follow this agent session profile as a hard system-level role constraint.'
	]
		.filter(Boolean)
		.join('\n\n')
}
