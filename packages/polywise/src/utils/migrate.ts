import * as sql_meta from '../sql/meta'

import type { Migration } from '../types'

export default async (
	migrations: Migration[],
	current_version: number,
	exec: (sql: string | string[]) => Promise<void>,
	query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
) => {
	const pending_migrations = migrations.filter(m => m.version > current_version)

	if (pending_migrations.length === 0) {
		return
	}

	for (const migration of pending_migrations) {
		await migration.up(exec, query)

		await query(sql_meta.sql_insert_version, [migration.version])
	}
}
