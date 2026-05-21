import { link, link_article } from '@core/db/schema'
import { getLink, getLinks, removeLink } from '@core/db/services'
import { getLinkArticles } from '@core/db/services/externals'
import removeArticle from '@core/io/remove'
import {
	createLinkcaseSchedule,
	linkcase_schedule_actions,
	linkcase_schedule_interval_units,
	listLinkcaseSchedules,
	removeLinkcaseSchedule,
	updateLinkcaseSchedule
} from '@core/rpc/linkcase/scheduler'
import {
	commitLinkcasePreview,
	createLinkcaseItem,
	fetchLinkcaseLink,
	getLinkcaseKeywordWhere,
	hydrateLinkcaseItems,
	linkcase_statuses,
	markLinkcaseFetchFailure,
	previewLinkcaseLinkWithProvider,
	readLinkcasePreview
} from '@core/rpc/linkcase/utils'
import { tool } from 'ai'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { array, boolean, enum as Enum, number, object, string, z } from 'zod'

import type { WebfetchFallbackProvider } from '@core/types'
import type { SQL } from 'drizzle-orm'
import type Session from '../session'

const linkCreateInputSchema = object({
	url: string().url().describe('Link URL to add.'),
	title: string().optional().describe('Human-readable title. Defaults to the URL when omitted.'),
	content: string()
		.optional()
		.describe(
			'Optional cleaned core article body to save together with the link. Remove ads, related links, comments, and other non-body noise.'
		)
})

const inputSchema = object({
	action: Enum([
		'create',
		'remove',
		'status',
		'list',
		'schedule_list',
		'schedule_create',
		'schedule_update',
		'schedule_remove',
		'fetch_next',
		'fetch_ids',
		'fetch_preview',
		'read_preview',
		'commit_preview',
		'mark_failed'
	]).describe(
		'The action to perform. create: add one or more new links, optionally with title and cleaned content. remove: delete one or more existing links and clean up orphaned fetched articles. status: count links by current status. list: list candidate links without fetching. fetch_next: automatically select and fetch the next batch. fetch_ids: fetch an explicit list of link ids. fetch_preview: fetch one link through one explicit provider without saving so the agent can inspect the result. read_preview: read another page from a previously fetched preview without switching providers. commit_preview: persist a previously inspected preview. mark_failed: finalize a failed AI-driven fetch attempt.'
	),
	url: string().url().optional().describe('[Required for create] Link URL to add.'),
	title: string()
		.optional()
		.describe('[Optional for create] Human-readable title. Defaults to the URL when omitted.'),
	links: array(linkCreateInputSchema)
		.min(1)
		.max(50)
		.optional()
		.describe(
			'[Optional for create] Batch-create up to 50 links in one call. When links is provided, it overrides the top-level url/title/content fields.'
		),
	ids: array(string())
		.min(1)
		.max(50)
		.optional()
		.describe(
			'[Required for fetch_ids, optional for remove] Exact link ids to fetch in sequence or delete in batch.'
		),
	id: string()
		.optional()
		.describe(
			'[Required for fetch_preview/mark_failed, optional for remove] Exact link id to inspect, mark, or delete.'
		),
	preview_key: string()
		.optional()
		.describe(
			'[Required for read_preview/commit_preview] Preview key returned by fetch_preview for the content you want to inspect or persist.'
		),
	schedule_id: string()
		.optional()
		.describe(
			'[Required for schedule_update/schedule_remove] Exact Linkcase scheduled task id to update or delete.'
		),
	scheduled_action: Enum(linkcase_schedule_actions)
		.optional()
		.describe('[Required for schedule_create] Whether the scheduled Linkcase task should fetch or extract.'),
	content: string()
		.optional()
		.describe(
			'[Required for commit_preview, optional for create] Cleaned core article body to save. Remove ads, share widgets, related links, author cards, post navigation, comments, subscribe prompts, cookie notices, and any other non-body text. You may rewrite markdown formatting, but preserve the article meaning.'
		),
	page: number()
		.int()
		.min(1)
		.optional()
		.describe(
			'[Required for read_preview] 1-based preview page to read. Each page contains up to 30000 characters.'
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
		.describe(
			'[Optional for list/fetch_next and schedule_create/schedule_update] Maximum number of links to inspect or process per run (default 3).'
		),
	interval_value: number()
		.int()
		.min(1)
		.optional()
		.describe('[Required for schedule_create, optional for schedule_update] Numeric repeat interval.'),
	interval_unit: Enum(linkcase_schedule_interval_units)
		.optional()
		.describe(
			'[Required for schedule_create, optional for schedule_update] Repeat interval unit for the scheduled Linkcase task.'
		),
	enabled: boolean()
		.optional()
		.describe('[Optional for schedule_update] Whether the scheduled Linkcase task should be enabled.'),
	auto_remove_dead_links: boolean()
		.optional()
		.describe(
			'[Optional for schedule_create/schedule_update] Fetch-only mode that delegates dead-link judgment to the Linkcase AI fetch session.'
		),
	extract_concurrency: number()
		.int()
		.min(1)
		.max(10)
		.optional()
		.describe(
			'[Optional for schedule_create/schedule_update] Extract-only fastq concurrency used by Croner-triggered background extract runs.'
		),
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

const stripFaviconFromLink = (value: unknown) => {
	if (!value || typeof value !== 'object' || !('favicon' in value)) {
		return value
	}

	const { favicon: _favicon, ...rest } = value as Record<string, unknown>

	return rest
}

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

const summarizeScheduleTask = (task: Awaited<ReturnType<typeof listLinkcaseSchedules>>[number]) => ({
	id: task.id,
	action: task.action,
	interval_value: task.interval_value,
	interval_unit: task.interval_unit,
	count: task.count,
	enabled: task.enabled,
	auto_remove_dead_links: task.auto_remove_dead_links,
	extract_concurrency: task.extract_concurrency,
	next_run_at: task.next_run_at,
	last_run_at: task.last_run_at,
	last_status: task.last_status,
	last_error: task.last_error,
	runs: task.runs
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

const removeOneLinkcaseItem = async (id: string) => {
	const current_link = await getLink(eq(link.id, id))

	if (!current_link) {
		return null
	}

	const related_articles = await getLinkArticles({
		where: eq(link_article.link_id, id)
	})

	await removeLink(eq(link.id, id))

	const removed_article_ids = [] as Array<string>

	for (const item of related_articles) {
		const remain = await getLinkArticles({
			where: eq(link_article.article_id, item.article.id),
			limit: 1
		})

		if (remain.length > 0) {
			continue
		}

		await removeArticle(item.article.id)
		removed_article_ids.push(item.article.id)
	}

	return {
		link: current_link,
		removed_article_ids
	}
}

export const createLinkcaseTool = (_s: Session) => {
	return tool({
		description: [
			'Batch-manage Linkcase link fetching.',
			'Use create to add one or multiple links to Linkcase, optionally with title and cleaned content.',
			'Use remove to delete one or multiple links by id. It also removes fetched articles that are no longer referenced by any remaining link.',
			'Use schedule_list, schedule_create, schedule_update, and schedule_remove to manage Linkcase built-in scheduled fetch or extract tasks.',
			'Scheduled extract tasks run in the app background through Croner plus fastq and support extract_concurrency from 1 to 10.',
			'Use fetch_next for automated scheduled runs. It prefers links with status none, fail, or timeout unless you override include_statuses.',
			'Fetching always uses the fallback chain and treats empty content as a failed attempt until a downstream provider succeeds or the chain is exhausted.',
			'For AI-guided fetch validation, use fetch_preview with one provider at a time. Inspect the returned content_preview yourself, decide whether it is the real target content, and either continue with the next provider, commit_preview, or mark_failed.',
			'fetch_preview caches up to max_chars characters, which defaults to 200000, and returns page 1 of that cached preview.',
			'Use read_preview with the same preview_key to inspect later pages from the current provider before switching to another provider. Each preview page contains up to 30000 characters.',
			'When using commit_preview, do not save the raw preview. First rewrite the result into cleaned core body content and pass that cleaned content through the content field.',
			'If the current preview already contains the correct and substantially complete target article body, clean it and commit it immediately instead of trying more providers for cosmetic cleanup.',
			'Use list or status first when you need to inspect the queue before fetching.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'create') {
				const create_inputs = input.links?.length
					? input.links
					: input.url
						? [{ url: input.url, title: input.title, content: input.content }]
						: []

				if (create_inputs.length === 0) {
					return {
						action: 'create' as const,
						error: 'url or links is required for create action'
					}
				}

				const results = [] as Array<Record<string, unknown>>

				for (const item of create_inputs) {
					try {
						const created_item = await createLinkcaseItem({
							url: item.url,
							title: item.title,
							content: item.content
						})

						results.push({
							ok: true as const,
							url: item.url,
							item: created_item ? stripFaviconFromLink(created_item) : null
						})
					} catch (error) {
						results.push({
							ok: false as const,
							url: item.url,
							error: error instanceof Error ? error.message : String(error)
						})
					}
				}

				const success_count = results.filter(item => item.ok === true).length
				const first_success = results.find(item => item.ok === true && item.item) as
					| { item: unknown }
					| undefined

				return {
					action: 'create' as const,
					ok: success_count > 0,
					count: results.length,
					success_count,
					fail_count: results.length - success_count,
					item: results.length === 1 ? (first_success?.item ?? null) : null,
					items: results
				}
			}

			if (input.action === 'remove') {
				const target_ids = Array.from(
					new Set(input.ids?.length ? input.ids : input.id ? [input.id] : [])
				)

				if (target_ids.length === 0) {
					return {
						action: 'remove' as const,
						error: 'id or ids is required for remove action'
					}
				}

				const results = [] as Array<Record<string, unknown>>

				for (const id of target_ids) {
					try {
						const removed = await removeOneLinkcaseItem(id)

						if (!removed) {
							results.push({
								id,
								ok: false as const,
								error: 'Link not found'
							})
							continue
						}

						results.push({
							id,
							ok: true as const,
							link: stripFaviconFromLink(removed.link),
							removed_article_ids: removed.removed_article_ids
						})
					} catch (error) {
						results.push({
							id,
							ok: false as const,
							error: error instanceof Error ? error.message : String(error)
						})
					}
				}

				const success_count = results.filter(item => item.ok === true).length
				const removed_article_count = results.reduce(
					(total, item) =>
						total +
						(Array.isArray(item.removed_article_ids) ? item.removed_article_ids.length : 0),
					0
				)
				const first_success = results.find(item => item.ok === true && item.link) as
					| { link: unknown }
					| undefined

				return {
					action: 'remove' as const,
					ok: success_count > 0,
					count: results.length,
					success_count,
					fail_count: results.length - success_count,
					removed_article_count,
					link: results.length === 1 ? (first_success?.link ?? null) : null,
					items: results
				}
			}

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

			if (input.action === 'schedule_list') {
				const tasks = await listLinkcaseSchedules()

				return {
					action: 'schedule_list' as const,
					count: tasks.length,
					tasks: tasks.map(summarizeScheduleTask)
				}
			}

			if (input.action === 'schedule_create') {
				if (!input.scheduled_action) {
					return {
						action: 'schedule_create' as const,
						error: 'scheduled_action is required for schedule_create action'
					}
				}

				if (!input.interval_value) {
					return {
						action: 'schedule_create' as const,
						error: 'interval_value is required for schedule_create action'
					}
				}

				if (!input.interval_unit) {
					return {
						action: 'schedule_create' as const,
						error: 'interval_unit is required for schedule_create action'
					}
				}

				const task = await createLinkcaseSchedule({
					action: input.scheduled_action,
					interval_value: input.interval_value,
					interval_unit: input.interval_unit,
					count: input.count ?? 3,
					auto_remove_dead_links: input.auto_remove_dead_links ?? false,
					extract_concurrency: input.extract_concurrency
				})

				return {
					action: 'schedule_create' as const,
					ok: true as const,
					task: summarizeScheduleTask(task)
				}
			}

			if (input.action === 'schedule_update') {
				if (!input.schedule_id) {
					return {
						action: 'schedule_update' as const,
						error: 'schedule_id is required for schedule_update action'
					}
				}

				const patch = {
					enabled: input.enabled,
					count: input.count,
					interval_value: input.interval_value,
					interval_unit: input.interval_unit,
					auto_remove_dead_links: input.auto_remove_dead_links,
					extract_concurrency: input.extract_concurrency
				}

				if (Object.values(patch).every(value => typeof value === 'undefined')) {
					return {
						action: 'schedule_update' as const,
						error: 'Provide at least one field to update'
					}
				}

				const task = await updateLinkcaseSchedule(input.schedule_id, patch)

				return {
					action: 'schedule_update' as const,
					ok: true as const,
					task: summarizeScheduleTask(task)
				}
			}

			if (input.action === 'schedule_remove') {
				if (!input.schedule_id) {
					return {
						action: 'schedule_remove' as const,
						error: 'schedule_id is required for schedule_remove action'
					}
				}

				return {
					action: 'schedule_remove' as const,
					...(await removeLinkcaseSchedule(input.schedule_id))
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

			if (input.action === 'read_preview') {
				if (!input.preview_key) {
					return {
						action: 'read_preview' as const,
						error: 'preview_key is required for read_preview action'
					}
				}

				if (!input.page) {
					return {
						action: 'read_preview' as const,
						error: 'page is required for read_preview action'
					}
				}

				return {
					action: 'read_preview' as const,
					...(await readLinkcasePreview({
						preview_key: input.preview_key,
						page: input.page
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

				if (!input.content?.trim()) {
					return {
						action: 'commit_preview' as const,
						error: 'content is required for commit_preview action'
					}
				}

				const result = await commitLinkcasePreview({
					preview_key: input.preview_key,
					content: input.content,
					exec_pipeline: input.exec_pipeline
				})

				return {
					action: 'commit_preview' as const,
					...result,
					link: stripFaviconFromLink(result.link)
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

				const result = await markLinkcaseFetchFailure({
					id: input.id,
					error: input.error.trim()
				})

				return {
					action: 'mark_failed' as const,
					...result,
					link: stripFaviconFromLink(result.link)
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
