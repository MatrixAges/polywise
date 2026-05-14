import { link } from '@core/db/schema'
import { getLinks } from '@core/db/services'
import {
	commitLinkcasePreview,
	fetchLinkcaseLink,
	getLinkcaseKeywordWhere,
	hydrateLinkcaseItems,
	linkcase_statuses,
	markLinkcaseFetchFailure,
	previewLinkcaseLinkWithProvider
} from '@core/rpc/linkcase/utils'
import { tool } from 'ai'
import { and, inArray, notInArray } from 'drizzle-orm'
import { array, boolean, enum as Enum, number, object, string, z } from 'zod'

import type { WebfetchFallbackProvider } from '@core/types'
import type { SQL } from 'drizzle-orm'
import type Session from '../session'

const inputSchema = object({
	action: Enum([
		'status',
		'list',
		'fetch_next',
		'fetch_ids',
		'fetch_preview',
		'commit_preview',
		'mark_failed'
	]).describe(
		'The action to perform. status: count links by current status. list: list candidate links without fetching. fetch_next: automatically select and fetch the next batch. fetch_ids: fetch an explicit list of link ids. fetch_preview: fetch one link through one explicit provider without saving so the agent can inspect the result. commit_preview: persist a previously inspected preview. mark_failed: finalize a failed AI-driven fetch attempt.'
	),
	ids: array(string()).optional().describe('[Required for fetch_ids] Exact link ids to fetch in sequence.'),
	id: string().optional().describe('[Required for fetch_preview/mark_failed] Exact link id to inspect or mark.'),
	preview_key: string()
		.optional()
		.describe(
			'[Required for commit_preview] Preview key returned by fetch_preview for the content you want to persist.'
		),
	provider: Enum(['agent-browser', 'opencli', 'crawl4ai', 'dokobot', 'r.jina.ai'])
		.optional()
		.describe(
			'[Required for fetch_preview] Run exactly this provider and return its content preview without automatic fallback.'
		),
	count: number()
		.int()
		.min(1)
		.max(10)
		.optional()
		.describe('[Optional for list/fetch_next] Maximum number of links to inspect or fetch (default 3).'),
	keyword: string()
		.optional()
		.describe('[Optional] Keyword matched against title and/or url to narrow candidate selection.'),
	match_title: boolean().optional().describe('[Optional] Whether keyword should match titles (default true).'),
	match_url: boolean().optional().describe('[Optional] Whether keyword should match urls (default true).'),
	include_statuses: array(Enum(linkcase_statuses))
		.optional()
		.describe(
			'[Optional] Limit candidates to specific statuses. Default for fetch_next is none, fail, timeout.'
		),
	exclude_statuses: array(Enum(linkcase_statuses))
		.optional()
		.describe('[Optional] Exclude candidates with these statuses.'),
	only_without_article: boolean()
		.optional()
		.describe('[Optional] Keep only links that do not yet have any fetched article.'),
	exec_pipeline: boolean()
		.optional()
		.describe(
			'[Optional for fetch actions and commit_preview] Whether to run the saved article through the content pipeline.'
		),
	max_chars: number()
		.int()
		.positive()
		.optional()
		.describe('[Optional for fetch actions] Maximum fetched markdown characters before truncation.'),
	error: string()
		.optional()
		.describe(
			'[Required for mark_failed] Agent-authored reason explaining why the current fetch should be considered failed.'
		)
})

const default_fetch_statuses = ['none', 'fail', 'timeout'] as const

type LinkcaseToolInput = z.infer<typeof inputSchema>

const buildWhere = (input: LinkcaseToolInput, use_default_fetch_statuses = false) => {
	const match_title = input.match_title ?? true
	const match_url = input.match_url ?? true
	const where_list = [] as Array<SQL>
	const keyword_where = getLinkcaseKeywordWhere(input.keyword, match_title, match_url)
	const include_statuses = (
		input.include_statuses && input.include_statuses.length > 0
			? input.include_statuses
			: use_default_fetch_statuses
				? [...default_fetch_statuses]
				: []
	) as Array<(typeof linkcase_statuses)[number]>

	if (keyword_where) {
		where_list.push(keyword_where)
	}

	if (include_statuses.length > 0) {
		where_list.push(inArray(link.status, include_statuses))
	}

	if (input.exclude_statuses?.length) {
		where_list.push(notInArray(link.status, input.exclude_statuses))
	}

	if (where_list.length === 0) {
		return undefined
	}

	if (where_list.length === 1) {
		return where_list[0]
	}

	return and(...where_list)
}

const summarizeItem = (item: Awaited<ReturnType<typeof hydrateLinkcaseItems>>[number]) => ({
	id: item.id,
	title: item.title,
	url: item.url,
	status: item.status,
	article_count: item.article_count,
	has_article: item.article_count > 0,
	updated_at: item.updated_at
})

const getCandidates = async (input: LinkcaseToolInput, use_default_fetch_statuses = false) => {
	const count = input.count ?? 3
	const rows = await getLinks({
		where: buildWhere(input, use_default_fetch_statuses),
		limit: Math.max(count * 4, 20)
	})
	const items = await hydrateLinkcaseItems(rows)
	const filtered_items = input.only_without_article ? items.filter(item => item.article_count === 0) : items

	return filtered_items.slice(0, count)
}

export const createLinkcaseTool = (_s: Session) => {
	return tool({
		description: [
			'Batch-manage Linkcase link fetching.',
			'Use fetch_next for automated scheduled runs. It prefers links with status none, fail, or timeout unless you override include_statuses.',
			'Fetching always uses the fallback chain and treats empty content as a failed attempt until a downstream provider succeeds or the chain is exhausted.',
			'For AI-guided fetch validation, use fetch_preview with one provider at a time. Inspect the returned content_preview yourself, decide whether it is the real target content, and either continue with the next provider, commit_preview, or mark_failed.',
			'Use list or status first when you need to inspect the queue before fetching.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'status') {
				const rows = await getLinks({
					where: buildWhere(input, false)
				})
				const counts = Object.fromEntries(linkcase_statuses.map(status => [status, 0])) as Record<
					string,
					number
				>

				for (const item of rows) {
					counts[item.status] = (counts[item.status] ?? 0) + 1
				}

				return {
					action: 'status' as const,
					total: rows.length,
					counts
				}
			}

			if (input.action === 'list') {
				const candidates = await getCandidates(input, false)

				return {
					action: 'list' as const,
					count: candidates.length,
					items: candidates.map(summarizeItem)
				}
			}

			if (input.action === 'fetch_preview') {
				if (!input.id) {
					return {
						action: 'fetch_preview' as const,
						error: 'id is required for fetch_preview action'
					}
				}

				if (!input.provider) {
					return {
						action: 'fetch_preview' as const,
						error: 'provider is required for fetch_preview action'
					}
				}

				return {
					action: 'fetch_preview' as const,
					...(await previewLinkcaseLinkWithProvider({
						id: input.id,
						provider: input.provider as WebfetchFallbackProvider,
						max_chars: input.max_chars
					}))
				}
			}

			if (input.action === 'commit_preview') {
				if (!input.preview_key) {
					return {
						action: 'commit_preview' as const,
						error: 'preview_key is required for commit_preview action'
					}
				}

				return {
					action: 'commit_preview' as const,
					...(await commitLinkcasePreview({
						preview_key: input.preview_key,
						exec_pipeline: input.exec_pipeline
					}))
				}
			}

			if (input.action === 'mark_failed') {
				if (!input.id) {
					return { action: 'mark_failed' as const, error: 'id is required for mark_failed action' }
				}

				if (!input.error?.trim()) {
					return {
						action: 'mark_failed' as const,
						error: 'error is required for mark_failed action'
					}
				}

				return {
					action: 'mark_failed' as const,
					...(await markLinkcaseFetchFailure({
						id: input.id,
						error: input.error.trim()
					}))
				}
			}

			const targets =
				input.action === 'fetch_ids'
					? await hydrateLinkcaseItems(
							input.ids?.length
								? await getLinks({
										where: inArray(link.id, input.ids)
									})
								: []
						)
					: await getCandidates(input, true)

			if (input.action === 'fetch_ids' && (!input.ids || input.ids.length === 0)) {
				return { action: 'fetch_ids' as const, error: 'ids is required for fetch_ids action' }
			}

			if (targets.length === 0) {
				return {
					action: input.action,
					count: 0,
					items: [],
					message: 'No candidate links matched the current batch fetch criteria.'
				}
			}

			const results = [] as Array<Record<string, unknown>>

			for (const item of targets) {
				try {
					const result = await fetchLinkcaseLink({
						id: item.id,
						exec_pipeline: input.exec_pipeline,
						max_chars: input.max_chars
					})

					results.push({
						id: item.id,
						title: item.title,
						url: item.url,
						ok: result.ok,
						status: result.link.status,
						source: result.source ?? null,
						error: result.ok ? null : (result.error ?? 'Unknown fetch error'),
						article_id: result.article?.id ?? null
					})
				} catch (error) {
					results.push({
						id: item.id,
						title: item.title,
						url: item.url,
						ok: false,
						status: 'fail',
						source: null,
						error: error instanceof Error ? error.message : String(error),
						article_id: null
					})
				}
			}

			const success_count = results.filter(item => item.ok === true).length

			return {
				action: input.action,
				count: results.length,
				success_count,
				fail_count: results.length - success_count,
				items: results
			}
		}
	})
}
