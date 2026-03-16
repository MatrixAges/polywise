import { env } from '@core/env'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export default () => {
	const db = drizzle({ client: env.sqlite })

	env.db = db

	return db
}
