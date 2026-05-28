import path from 'path'
import { fileURLToPath } from 'url'
import { env } from '@core/env'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export default () => {
	const migrations_dir = fileURLToPath(new URL('../drizzle', import.meta.url))

	migrate(env.db, { migrationsFolder: path.resolve(migrations_dir) })
}
