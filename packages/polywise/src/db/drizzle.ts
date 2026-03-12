import { env } from '@core/env'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export default () => drizzle({ client: env.sqlite })
