import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from '@core/env'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const getMigrationsDir = () => {
	const dist_migrations_dir = fileURLToPath(new URL('./drizzle', import.meta.url))

	if (existsSync(dist_migrations_dir)) {
		return path.resolve(dist_migrations_dir)
	}

	const package_migrations_dir = fileURLToPath(new URL('../drizzle', import.meta.url))

	return path.resolve(package_migrations_dir)
}

export default () => {
	const migrations_dir = getMigrationsDir()

	migrate(env.db, { migrationsFolder: migrations_dir })
}
