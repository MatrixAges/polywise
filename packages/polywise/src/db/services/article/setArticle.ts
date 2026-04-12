import { article } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ArticleInsert } from '@core/db'

export default async (where: SQL, values: Partial<ArticleInsert>) => {
	const res = await env.db.update(article).set(values).where(where).returning()

	return res
}
