import { session_todo } from '@core/db/schema'
import { env } from '@core/env'

export default async (session_id: string, todo_id: string) => {
	const [res] = await env.db.insert(session_todo).values({ session_id, todo_id }).returning()

	return res
}
