import { message } from '@core/db/schema'
import { getMessagesCount } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const count = await getMessagesCount(eq(message.session_id, s.id))

	return count
}
