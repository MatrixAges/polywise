import { session } from '@core/db/schema'
import { setSession } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type { SessionInsert } from '@core/db'
import type Index from '../index'

export default async (s: Index, args: Partial<SessionInsert>) => {
	const res = await setSession(eq(session.id, s.id), args)

	if (res) {
		s.session = res
	}

	return res
}
