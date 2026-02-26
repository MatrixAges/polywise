import type { PGlite } from '@electric-sql/pglite'
import type { Scopes } from '../types'

export default async (db: PGlite, scopes: Scopes) => {
	const { root_ids, idol_id, context_id } = scopes

	await db.query(`select set_config('app.root_ids', $1, false)`, [root_ids])
	await db.query(`select set_config('app.idol_id', $1, false)`, [idol_id])
	await db.query(`select set_config('app.context_id', $1, false)`, [context_id])
}
