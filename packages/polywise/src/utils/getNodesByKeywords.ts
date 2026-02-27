import sql from '../sql'
import querySql from './querySql'

import type { PGlite } from '@electric-sql/pglite'
import type { Node } from '../types'

export default async (db: PGlite, keywords: Array<string>) => {
	if (keywords.length === 0) {
		return []
	}

	const results: Array<Node> = []

	for (const keyword of keywords) {
		const nodes = await querySql<Node>(db, sql.brain.sql_recall_nodes_by_label, [`%${keyword}%`, 10])

		results.push(...nodes)
	}

	return Array.from(new Map(results.map(n => [n.id, n])).values())
}
