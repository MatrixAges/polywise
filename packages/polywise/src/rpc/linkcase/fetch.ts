import { config } from '@core/config'
import { article, link } from '@core/db/schema'
import { getArticle, getLink, setLink } from '@core/db/services'
import { addLinkArticle } from '@core/db/services/externals'
import { saveArticle } from '@core/io'
import { eq } from 'drizzle-orm'
import TurndownService from 'turndown'
import { boolean, number, object, string } from 'zod'

import { p } from '../../utils/trpc'

const turndown = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	emDelimiter: '*'
})

turndown.remove(['script', 'style', 'meta', 'link'])

const DEFAULT_MAX_CHARS = 50000

const input_type = object({
	id: string(),
	exec_pipeline: boolean().optional(),
	max_chars: number().int().positive().optional()
})

const isTimeoutError = (message?: string) => {
	return typeof message === 'string' && /timeout|timed out|aborted|abort/i.test(message)
}

const fetchLinkContent = async (url: string, max_chars: number) => {
	const jina_api_key = config.jina_api_key?.trim()
	let jina_error = undefined as string | undefined

	try {
		const resp = await fetch(`https://r.jina.ai/${url}`, {
			signal: AbortSignal.timeout(30000),
			headers: {
				...(jina_api_key ? { Authorization: `Bearer ${jina_api_key}` } : {})
			}
		})

		if (!resp.ok) throw new Error(`Jina returned HTTP ${resp.status}`)

		const markdown = await resp.text()

		if (!markdown.trim()) throw new Error('Jina returned empty content')

		return {
			ok: true as const,
			source: 'jina' as const,
			content: markdown.slice(0, max_chars),
			truncated: markdown.length > max_chars
		}
	} catch (error: unknown) {
		jina_error = error instanceof Error ? error.message : 'Unknown error'

		try {
			const resp = await fetch(url, {
				signal: AbortSignal.timeout(15000),
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
					Accept: 'text/html,application/xhtml+xml,*/*'
				}
			})

			if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

			const html = await resp.text()
			const markdown = turndown.turndown(html)

			return {
				ok: true as const,
				source: 'direct' as const,
				content: markdown.slice(0, max_chars),
				truncated: markdown.length > max_chars,
				jina_error
			}
		} catch (error: unknown) {
			return {
				ok: false as const,
				source: 'direct' as const,
				jina_error,
				direct_error: error instanceof Error ? error.message : 'Unknown error'
			}
		}
	}
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
	const result = await fetchLinkContent(current_link.url, max_chars)

	if (!result.ok) {
		const status = isTimeoutError(result.jina_error) || isTimeoutError(result.direct_error) ? 'timeout' : 'fail'
		const updated_link = await setLink(eq(link.id, input.id), { status })

		return {
			ok: false,
			link: updated_link ?? current_link,
			article: null,
			source: result.source,
			jina_error: result.jina_error ?? null,
			direct_error: result.direct_error
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
			jina_error: result.source === 'direct' ? (result.jina_error ?? null) : null
		}
	} catch (error) {
		await setLink(eq(link.id, input.id), {
			status: 'fail'
		})

		throw error
	}
})
