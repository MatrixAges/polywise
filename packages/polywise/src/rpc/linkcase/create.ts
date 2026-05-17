import { link } from '@core/db/schema'
import { addLink, setLink } from '@core/db/services'
import { addLinkArticle } from '@core/db/services/externals'
import { saveArticle } from '@core/io'
import { eq } from 'drizzle-orm'
import { object, string, url } from 'zod'

import { p } from '../../utils/trpc'
import { getLinkFavicon } from './getLinkFavicon'
import { getLinkcaseReadItem } from './utils'

const input_type = object({
	url: url(),
	title: string().optional(),
	content: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const title = input.title?.trim() || input.url
	const content = input.content?.trim() || ''
	const favicon = await getLinkFavicon(input.url).catch(() => null)

	const created_link = await addLink({
		url: input.url,
		title,
		...(favicon ? { favicon } : {})
	})

	if (!created_link) {
		throw new Error(`Failed to create link: ${input.url}`)
	}

	const update_values = {
		title,
		...(favicon ? { favicon } : {}),
		...(content
			? {
					status: 'success' as const,
					generate_at: new Date()
				}
			: {})
	}

	await setLink(eq(link.id, created_link.id), update_values)

	if (content) {
		const article_id = await saveArticle({
			title,
			content,
			for: 'linkcase',
			exec_pipeline: false
		})

		await addLinkArticle(created_link.id, article_id)
	}

	return getLinkcaseReadItem(created_link.id)
})
