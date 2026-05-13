import dayjs from 'dayjs'
import { array, object, string, unknown } from 'zod'

import { addGroup, addSession } from '../../db/services'
import { addGroupAgent, addGroupSession } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const folder_item_schema = object({
	name: string(),
	path: string()
})

const input_type = object({
	name: string(),
	description: string().optional(),
	photo: unknown().optional(),
	agent_ids: array(string()).min(1),
	folders: array(folder_item_schema).default([]),
	title: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	console.log('[group-debug][rpc.group.create] input', {
		name: input.name,
		description_length: input.description?.length ?? 0,
		agent_ids_count: input.agent_ids.length,
		agent_ids: input.agent_ids,
		folders_count: input.folders.length
	})

	const group = await addGroup({
		name: input.name,
		description: input.description || undefined,
		photo: (input.photo as Uint8Array | null | undefined) ?? undefined,
		folders: input.folders
	})

	if (!group) {
		throw new Error('Failed to create group')
	}

	for (const [index, agent_id] of input.agent_ids.entries()) {
		await addGroupAgent(group.id, agent_id, index)
	}

	console.log('[group-debug][rpc.group.create] relations-written', {
		group_id: group.id,
		agent_ids_count: input.agent_ids.length,
		agent_ids: input.agent_ids
	})

	const session = await addSession({
		title: input.title || input.name || `Group ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
	})

	await addGroupSession(group.id, session.id)

	console.log('[group-debug][rpc.group.create] done', {
		group_id: group.id,
		session_id: session.id
	})

	return { group, session }
})
