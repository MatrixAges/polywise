import { session } from '@core/db/schema'
import { getSession } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await getSession(eq(session.id, s.id))

	s.session = res
	s.running_since = res?.running_since ?? null

	await s.getModel()
}
