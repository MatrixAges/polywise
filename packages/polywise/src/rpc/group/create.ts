import dayjs from 'dayjs'
import { array, object, string, unknown } from 'zod'

import { addGroup, addSession } from '../../db/services'
import { addGroupAgent, addGroupFolder, addGroupSession } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	name: string(),
	description: string().optional(),
	photo: unknown().optional(),
	agent_ids: array(string()).default([]),
	folder_paths: array(string()).default([]),
	title: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const group = await addGroup({
		name: input.name,
		description: input.description || undefined,
		photo: (input.photo as Uint8Array | null | undefined) ?? undefined
	})

	if (!group) {
		throw new Error('Failed to create group')
	}

	for (const [index, agent_id] of input.agent_ids.entries()) {
		await addGroupAgent(group.id, agent_id, index)
	}

	for (const [index, folder_path] of input.folder_paths.entries()) {
		await addGroupFolder(group.id, folder_path, index)
	}

	const session = await addSession({
		title: input.title || input.name || `Group ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
	})

	await addGroupSession(group.id, session.id)

	return { group, session }
})
