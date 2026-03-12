import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { env } from './env'

export default betterAuth({
	database: drizzleAdapter(env.db, { provider: 'pg' }),
	emailAndPassword: { enabled: true }
})
