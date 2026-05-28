import { todo_session } from '@core/db/schema'
import { getTodoSession } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type { EnvCap } from '../../core/types'

const defaultEnv: EnvCap = {
	scope: s => {
		if (s.project) {
			return { type: 'project', id: s.project.id }
		}

		if (s.owner_agent) {
			return { type: 'agent', id: s.owner_agent.id }
		}

		return { type: 'global', id: null }
	},
	cwd: s => s.project?.dir || s.files_dir,
	mounts: () => [],
	contextDir: s => s.base_context_dir,
	stateDir: s => s.base_state_dir,
	contextHistoryDir: s => s.base_context_history_dir,
	hasTodoLink: s => getTodoSession(eq(todo_session.session_id, s.id)).then(Boolean)
}

export default defaultEnv
