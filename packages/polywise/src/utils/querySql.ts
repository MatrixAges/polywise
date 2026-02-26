import type { PGlite } from '@electric-sql/pglite'

export default async <Res>(db: PGlite, sql: string, params?: Array<any>) => {
	const res = await db.query(sql, params)

	return res.rows as Array<Res>
}
