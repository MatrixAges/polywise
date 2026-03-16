import { article } from '@core/db/schema'
import { env } from '@core/env'
import { getChunks } from '@core/pipeline'
import { getHash } from '@core/utils'
import { eq } from 'drizzle-orm'
import pc from 'picocolors'

export default async (v: string) => {
	const hash = getHash(v)

	const exist = await env.db.select().from(article).where(eq(article.hash, hash))

	if (exist.length > 0) return exist[0].id

	const chunks = await getChunks(v)

	console.log(chunks.length)

	chunks.map(item => {
		console.log(pc.green('[***************************]'))
		console.log(item)
	})
}
