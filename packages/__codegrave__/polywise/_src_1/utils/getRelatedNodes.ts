import sql from '../sql'
import querySql from './querySql'

import type { PGlite } from '@electric-sql/pglite'
import type { Node } from '../types'

export default async (db: PGlite, node_ids: Array<string>, max_depth: number, context_id?: string) => {
	if (node_ids.length === 0 || max_depth <= 0) return []

	return querySql<Node>(db, sql.brain.sql_recall_related_nodes, [node_ids, max_depth, 20, context_id ?? null])
}
