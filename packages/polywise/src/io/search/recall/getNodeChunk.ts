import { env } from '@core/env'

export default (node_ids: string[]) => {
	if (node_ids.length === 0) return []

	const placeholders = node_ids.map(() => '?').join(',')

	const query = `
		SELECT nc.node_id, nc.chunk_id, c.article_id
		FROM node_chunk nc
		JOIN chunk c ON c.id = nc.chunk_id
		WHERE nc.node_id IN (${placeholders})
	`

	const stmt = env.sqlite.prepare(query)
	return stmt.all(...node_ids) as Array<{ node_id: string; chunk_id: string; article_id: string }>
}
