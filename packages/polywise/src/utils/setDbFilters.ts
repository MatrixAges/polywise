import type { PGlite } from '@electric-sql/pglite'

export const setDbScope = async (db: PGlite, scope: { root_ids?: string; idol_id?: string; context_id?: string }) => {
	const root_ids = scope.root_ids || ''
	const idol_id = scope.idol_id || ''
	const context_id = scope.context_id || ''

	await db.query(`select set_config('app.root_ids', $1, false)`, [root_ids])
	await db.query(`select set_config('app.idol_id', $1, false)`, [idol_id])
	await db.query(`select set_config('app.context_id', $1, false)`, [context_id])
}
