import { env } from '@core/env'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema'

export default () => {
	const db = drizzle({ client: env.sqlite, schema, relations: defineRelations(schema) })

	env.db = db

	return db
}
