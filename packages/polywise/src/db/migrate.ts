import { resolve } from 'path'
import { env } from '@core/env'
import { migrate } from 'drizzle-orm/pglite/migrator'

export default async () => {
	await migrate(env.db, { migrationsFolder: resolve(`${process.cwd()}/drizzle`) })
}
