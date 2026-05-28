import { to } from 'await-to-js'
import fs from 'fs-extra'

import { appendContextHistory } from '../../../utils'
import setGroupTasks from './setGroupTasks'

import type Session from '../../../session'
import type { GroupContext } from '../types'

export default async (
	s: Session,
	v: Partial<GroupContext>,
	args?: { agent_id?: string; agent_name?: string; turn_id?: string | null }
) => {
	if (v.tasks) {
		await setGroupTasks(s, v.tasks, args)
	}

	const nextContext = {
		...s.context,
		...v,
		group_name: s.group!.name,
		group_description: s.group!.description ?? undefined,
		active_turn_id: args?.turn_id ?? s.active_turn_id ?? null,
		active_agent_id:
			args?.agent_id ??
			(v as GroupContext).active_agent_id ??
			(s.context as GroupContext).active_agent_id ??
			null,
		active_agent_name:
			args?.agent_name ??
			(v as GroupContext).active_agent_name ??
			(s.context as GroupContext).active_agent_name ??
			null,
		total_messages_count: s.context.total_messages_count,
		current_messages_count: s.context.current_messages_count
	} as GroupContext

	if (v.tasks) {
		nextContext.tasks = s.context.tasks
	}

	s.context = nextContext

	const [err] = await to(fs.writeJSON(s.context_dir, s.context, { spaces: 4 }))

	if (err) return

	appendContextHistory(s.context_history_dir, s.context)

	return s.context
}
