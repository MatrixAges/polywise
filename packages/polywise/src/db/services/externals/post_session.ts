import { article, post_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetPostSessions {
	where?: SQL
}

export const getPostSessions = async (args: ArgsGetPostSessions = {}) => {
	const { where } = args

	let query = env.db
		.select({ post_session, session, article })
		.from(post_session)
		.innerJoin(session, eq(post_session.session_id, session.id))
		.innerJoin(article, eq(post_session.post_id, article.id))
		.orderBy(desc(post_session.created_at))
		.$dynamic()

	if (where) query = query.where(where)

	return query
}

export const getPostSessionIdList = async () => {
	const list = await env.db.select({ session_id: post_session.session_id }).from(post_session)

	return list.map(item => item.session_id)
}

export const addPostSession = async (post_id: string, session_id: string) => {
	return env.db
		.insert(post_session)
		.values({ post_id, session_id })
		.returning()
		.then(res => res[0])
}

export const removePostSession = async (where: SQL) => {
	return env.db
		.delete(post_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
