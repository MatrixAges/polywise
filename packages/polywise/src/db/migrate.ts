import path from 'path'
import { env } from '@core/env'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export default () => {
	migrate(env.db, { migrationsFolder: path.resolve(`${process.cwd()}/drizzle`) })
}
