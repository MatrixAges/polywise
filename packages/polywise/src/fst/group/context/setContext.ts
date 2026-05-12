import { to } from 'await-to-js'
import fs from 'fs-extra'

import { appendContextHistory } from '../../utils'
import setTasks from '../task/setTasks'

import type Group from '../index'
import type { GroupContext } from '../types'

export default async (
	s: Group,
	v: Partial<GroupContext>,
	args?: { agent_id?: string; agent_name?: string; turn_id?: string | null }
) => {
	if (v.tasks) {
		await setTasks(s, v.tasks, args)
	}

	const next_context = {
		...s.context,
		...v,
		group_name: s.group.name,
		group_description: s.group.description ?? undefined,
		active_turn_id: args?.turn_id ?? s.active_turn_id ?? null,
		active_agent_id: args?.agent_id ?? v.active_agent_id ?? s.context.active_agent_id ?? null,
		active_agent_name: args?.agent_name ?? v.active_agent_name ?? s.context.active_agent_name ?? null,
		total_messages_count: s.context.total_messages_count,
		current_messages_count: s.context.current_messages_count
	} as GroupContext

	if (v.tasks) {
		next_context.tasks = s.context.tasks
	}

	s.context = next_context

	const [err] = await to(fs.writeJSON(s.context_dir, s.context, { spaces: 4 }))

	if (err) return

	appendContextHistory(s.context_history_dir, s.context)

	return s.context
}
