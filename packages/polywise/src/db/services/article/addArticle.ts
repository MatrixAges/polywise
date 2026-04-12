import { article } from '@core/db/schema'
import { env } from '@core/env'

import type { ArticleInsert } from '@core/db'

export default async (values: ArticleInsert) => {
	const [res] = await env.db.insert(article).values(values).returning()

	return res
}
