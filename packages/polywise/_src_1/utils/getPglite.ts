import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'

const db_cache = new Map<string, PGlite>()

export const getPglite = async (data_dir: string) => {
	const cached_db = db_cache.get(data_dir)

	if (cached_db) return cached_db

	const db = await PGlite.create(data_dir, {
		relaxedDurability: true,
		extensions: { vector }
	})

	db_cache.set(data_dir, db)

	return db
}

export const closePglite = async (data_dir: string) => {
	const cached_db = db_cache.get(data_dir)

	if (!cached_db) return

	await cached_db.close()

	db_cache.delete(data_dir)
}
