import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { db } from './db'

export default betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true }
})
