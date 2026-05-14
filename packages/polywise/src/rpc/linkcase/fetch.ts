import { article, link } from '@core/db/schema'
import { getArticle, getLink, setLink } from '@core/db/services'
import { addLinkArticle } from '@core/db/services/externals'
import { fetchWithFallbackChain } from '@core/fetch'
import { saveArticle } from '@core/io'
import { eq } from 'drizzle-orm'
import { boolean, number, object, string } from 'zod'

import { p } from '../../utils/trpc'

const DEFAULT_MAX_CHARS = 50000

const input_type = object({
	id: string(),
	exec_pipeline: boolean().optional(),
	max_chars: number().int().positive().optional()
})

const isTimeoutError = (message?: string) => {
	return typeof message === 'string' && /timeout|timed out|aborted|abort/i.test(message)
}

export default p.input(input_type).mutation(async ({ input }) => {
	const current_link = await getLink(eq(link.id, input.id))

	if (!current_link) {
		throw new Error(`Link not found: ${input.id}`)
	}

	await setLink(eq(link.id, input.id), {
		status: 'pending'
	})

	const max_chars = input.max_chars ?? DEFAULT_MAX_CHARS
	const result = await fetchWithFallbackChain(current_link.url, max_chars)

	if (!result.ok) {
		const status =
			isTimeoutError(result.error) || result.attempts.some(item => isTimeoutError(item.error))
				? 'timeout'
				: 'fail'
		const updated_link = await setLink(eq(link.id, input.id), { status })

		return {
			ok: false,
			link: updated_link ?? current_link,
			article: null,
			source: result.source,
			error: result.error,
			attempts: result.attempts
		}
	}

	try {
		const article_id = await saveArticle({
			title: current_link.title,
			content: result.content,
			for: 'linkcase',
			exec_pipeline: input.exec_pipeline
		})

		await addLinkArticle(current_link.id, article_id)

		const article_item = await getArticle(eq(article.id, article_id))
		const updated_link = await setLink(eq(link.id, input.id), {
			status: 'success',
			generate_at: new Date()
		})

		return {
			ok: true,
			link: updated_link ?? current_link,
			article: article_item ?? null,
			source: result.source,
			truncated: result.truncated,
			attempts: result.attempts
		}
	} catch (error) {
		await setLink(eq(link.id, input.id), {
			status: 'fail'
		})

		throw error
	}
})
