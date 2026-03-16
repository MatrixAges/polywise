import { resolve } from 'path'
import { env } from '@core/env'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export default () => {
	migrate(env.db, { migrationsFolder: resolve(`${process.cwd()}/drizzle`) })
}
