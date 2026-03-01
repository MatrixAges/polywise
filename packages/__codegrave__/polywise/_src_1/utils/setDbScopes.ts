import type { PGlite } from '@electric-sql/pglite'
import type { Scopes } from '../types'

export default async (db: PGlite, scopes: Scopes) => {
	const { workspace_id, project_id, idol_id } = scopes

	await db.query(`select set_config('app.workspace_id', $1, false)`, [workspace_id])
	await db.query(`select set_config('app.project_id', $1, false)`, [project_id])
	await db.query(`select set_config('app.idol_id', $1, false)`, [idol_id])
}
