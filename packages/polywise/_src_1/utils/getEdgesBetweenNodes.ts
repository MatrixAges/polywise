import sql from '../sql'
import querySql from './querySql'

import type { PGlite } from '@electric-sql/pglite'
import type { Edge } from '../types'

export default async (db: PGlite, node_ids: Array<string>) => {
	if (node_ids.length < 2) {
		return []
	}

	return querySql<Edge>(db, sql.brain.sql_get_edges_between_nodes, [node_ids])
}
