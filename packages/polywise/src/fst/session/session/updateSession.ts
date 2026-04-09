import { session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type { SessionInsert } from '@core/db'
import type Index from '../index'

export default async (s: Index, args: Partial<SessionInsert>) => {
	const [res] = await env.db.update(session).set(args).where(eq(session.id, s.id)).returning()

	if (res) {
		s.session = res
	}

	return res
}
