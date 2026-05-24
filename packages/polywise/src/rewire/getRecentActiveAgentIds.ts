import { env } from '@core/env'

const recent_active_window_ms = 7 * 24 * 60 * 60 * 1000

export default async () => {
	const window_start = Date.now() - recent_active_window_ms
	const rows = env.sqlite
		.prepare(
			`
			SELECT DISTINCT agent_id
			FROM (
				SELECT ag.agent_id AS agent_id
				FROM agent_session ag
				INNER JOIN session s ON s.id = ag.session_id
				INNER JOIN agent a ON a.id = ag.agent_id
				WHERE s.updated_at >= ? AND a.is_frozen = 0
				UNION
				SELECT sa.agent_id AS agent_id
				FROM session_agent sa
				INNER JOIN session s ON s.id = sa.session_id
				INNER JOIN agent a ON a.id = sa.agent_id
				WHERE s.updated_at >= ? AND a.is_frozen = 0
			)
		`
		)
		.all(window_start, window_start) as Array<{ agent_id: string | null }>

	return rows.map(item => item.agent_id).filter((item): item is string => Boolean(item))
}
