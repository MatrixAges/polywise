import { env } from '@core/env'
import { drizzle } from 'drizzle-orm/pglite'

export default () => drizzle({ client: env.pglite })
