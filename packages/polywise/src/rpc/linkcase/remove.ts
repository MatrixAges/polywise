import { link, link_article } from '@core/db/schema'
import { getLink, removeLink } from '@core/db/services'
import { getLinkArticles } from '@core/db/services/externals'
import { remove } from '@core/io'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_link = await getLink(eq(link.id, input.id))

	if (!current_link) {
		return null
	}

	const related_articles = await getLinkArticles({
		where: eq(link_article.link_id, input.id)
	})

	await removeLink(eq(link.id, input.id))

	const removed_article_ids = [] as Array<string>

	for (const item of related_articles) {
		const remain = await getLinkArticles({
			where: eq(link_article.article_id, item.article.id),
			limit: 1
		})

		if (remain.length > 0) {
			continue
		}

		await remove(item.article.id)
		removed_article_ids.push(item.article.id)
	}

	return {
		link: current_link,
		removed_article_ids
	}
})
