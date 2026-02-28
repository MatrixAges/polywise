import sql from '../sql'
import querySql from './querySql'

import type { PGlite } from '@electric-sql/pglite'

export default async (db: PGlite, node_ids: Array<string>) => {
	if (!node_ids.length) return []

	const articles = await querySql<{ id: string }>(db, sql.brain.sql_get_node_articles, [node_ids])

	return articles.map(article => ({
		article_ids: [article.id],
		relevance_score: 1.0
	}))
}
