import { addMessage } from '@core/db/services'

import type { MessageInsert } from '@core/db'
import type { Message } from '../../types'
import type Index from '../index'

export default async (s: Index, v: Message) => {
	await addMessage({ id: v.id, session_id: s.id, role: v.role, content: JSON.stringify(v) } as MessageInsert)
}
