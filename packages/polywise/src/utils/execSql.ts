import type { PGlite } from '@electric-sql/pglite'

export default async (db: PGlite, sql: string | Array<string>) => {
	if (Array.isArray(sql)) {
		for (const sql_str of sql) {
			await db.exec(sql_str)
		}

		return
	}

	await db.exec(sql)
}
