import { addLinks, getLinksByHashesOrUrls, prepareLinkInsert } from '@core/db/services'

import {
	chrome_browser_config,
	edge_browser_config,
	getChromiumBookmarkStatus,
	readChromiumBookmarks
} from './chromium'
import { getFirefoxBookmarkStatus, readFirefoxBookmarks } from './firefox'
import { sniffer_browser_ids } from './types'

import type { LinkInsert } from '@core/db'
import type { SnifferBrowserId, SnifferBrowserStatus, SnifferImportResult, SnifferReadResult } from './types'

const getBrowserStatusMap = () => ({
	chrome: () => getChromiumBookmarkStatus(chrome_browser_config),
	firefox: () => getFirefoxBookmarkStatus(),
	edge: () => getChromiumBookmarkStatus(edge_browser_config)
})

const getBrowserReaderMap = () => ({
	chrome: readChromiumBookmarks,
	firefox: readFirefoxBookmarks,
	edge: readChromiumBookmarks
})

export const getSnifferStatuses = async () => {
	const status_map = getBrowserStatusMap()

	return Promise.all(sniffer_browser_ids.map(browser => status_map[browser]()))
}

export const getSnifferStatus = async (browser: SnifferBrowserId) => {
	const status_map = getBrowserStatusMap()

	return status_map[browser]()
}

const buildImportResult = (args: {
	status: SnifferBrowserStatus
	read_result: SnifferReadResult
	insert_candidates: Array<LinkInsert>
	inserted: Awaited<ReturnType<typeof addLinks>>
	ignored_existing_count: number
	ignored_duplicate_count: number
	ignored_invalid_count: number
}): SnifferImportResult => {
	const {
		status,
		read_result,
		insert_candidates,
		inserted,
		ignored_existing_count,
		ignored_duplicate_count,
		ignored_invalid_count
	} = args

	return {
		browser: status.id,
		name: status.name,
		available: status.available,
		source_count: status.source_count,
		total_bookmarks: read_result.items.length,
		candidate_count: insert_candidates.length,
		inserted_count: inserted.length,
		ignored_existing_count:
			ignored_existing_count +
			Math.max(insert_candidates.length - inserted.length - ignored_existing_count, 0),
		ignored_duplicate_count,
		ignored_invalid_count,
		error_count: read_result.error_count,
		errors: read_result.errors.slice(0, 10),
		inserted_preview: inserted.slice(0, 10).map(item => ({
			title: item.title,
			url: item.url
		})),
		message: !status.available
			? status.message
			: [
					`Imported ${inserted.length} bookmark(s).`,
					ignored_existing_count > 0 ? `Ignored ${ignored_existing_count} existing item(s).` : '',
					ignored_duplicate_count > 0
						? `Ignored ${ignored_duplicate_count} duplicate item(s) inside the import batch.`
						: '',
					ignored_invalid_count > 0 ? `Ignored ${ignored_invalid_count} invalid bookmark(s).` : '',
					read_result.error_count > 0
						? `${read_result.error_count} source read error(s) occurred.`
						: ''
				]
					.filter(Boolean)
					.join(' ')
	}
}

export const importBrowserBookmarks = async (browser: SnifferBrowserId): Promise<SnifferImportResult> => {
	const status = await getSnifferStatus(browser)

	if (!status.available) {
		return {
			browser,
			name: status.name,
			available: false,
			source_count: status.source_count,
			total_bookmarks: 0,
			candidate_count: 0,
			inserted_count: 0,
			ignored_existing_count: 0,
			ignored_duplicate_count: 0,
			ignored_invalid_count: 0,
			error_count: 0,
			errors: [],
			inserted_preview: [],
			message: status.message
		}
	}

	const reader_map = getBrowserReaderMap()
	const read_result = await reader_map[browser](status.sources)
	const candidate_map = new Map<string, LinkInsert>()
	let ignored_invalid_count = 0
	let ignored_duplicate_count = 0

	for (const item of read_result.items) {
		try {
			const next_item = prepareLinkInsert({
				url: item.url,
				title: item.title
			})

			if (candidate_map.has(next_item.hash!)) {
				ignored_duplicate_count += 1

				continue
			}

			candidate_map.set(next_item.hash!, next_item)
		} catch {
			ignored_invalid_count += 1
		}
	}

	const insert_candidates = Array.from(candidate_map.values())
	const existing_links = await getLinksByHashesOrUrls({
		hashes: insert_candidates.map(item => item.hash!).filter(Boolean),
		urls: insert_candidates.map(item => item.url)
	})
	const existing_hash_set = new Set(
		existing_links
			.map(item => item.hash)
			.filter((value): value is string => typeof value === 'string' && value.length > 0)
	)
	const existing_url_set = new Set(existing_links.map(item => item.url))
	const filtered_insert_values = insert_candidates.filter(
		item => !existing_hash_set.has(item.hash!) && !existing_url_set.has(item.url)
	)
	const inserted = await addLinks(filtered_insert_values)
	const ignored_existing_count = insert_candidates.length - filtered_insert_values.length

	return buildImportResult({
		status,
		read_result,
		insert_candidates,
		inserted,
		ignored_existing_count,
		ignored_duplicate_count,
		ignored_invalid_count
	})
}
