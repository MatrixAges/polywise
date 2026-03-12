import { resolve } from 'path'
import { migrate } from 'drizzle-orm/pglite/migrator'

import db from './db'

export default async () => {
	await migrate(db, { migrationsFolder: resolve(`${process.cwd()}/drizzle`) })
}
