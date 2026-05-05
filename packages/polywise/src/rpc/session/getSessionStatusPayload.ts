import { todo, todo_session } from '@core/db/schema'
import { getTodo, getTodoSession } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type { Session } from '@core/db'
import type SessionIndex from '@core/fst/session'

const getSessionStatusPayload = async (
	args: { session: Session; running_since: Date | null; running_done?: Date | null } | { session: SessionIndex }
) => {
	const session_item = 'session' in args && 'running_since' in args ? args.session : args.session.session
	const running_since =
		'session' in args && 'running_since' in args ? args.running_since : args.session.running_since
	const running_done =
		'session' in args && 'running_since' in args
			? (args.running_done ?? args.session.running_done ?? null)
			: (args.session.session.running_done ?? null)
	const session_link = await getTodoSession(eq(todo_session.session_id, session_item.id))
	const linked_todo = session_link ? await getTodo(eq(todo.id, session_link.todo_id)) : null

	return {
		title: session_item.title,
		report: session_item.report,
		running: session_item.is_runing,
		unread: session_item.unread ?? false,
		running_since: running_since?.getTime() ?? null,
		running_done: running_done?.getTime() ?? null,
		status: linked_todo?.status ?? null
	}
}

export default getSessionStatusPayload
