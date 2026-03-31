import { message } from '@core/db/schema'
import { env } from '@core/env'

import type { MessageInsert } from '@core/db'
import type { Message } from '../types'
import type Index from './index'

export default async (s: Index, v: Message) => {
	await env.db
		.insert(message)
		.values({ id: v.id, session_id: s.id, role: v.role, content: JSON.stringify(v) } as MessageInsert)
}
