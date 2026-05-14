export const sniffer_browser_ids = ['chrome', 'firefox', 'edge'] as const

export type SnifferBrowserId = (typeof sniffer_browser_ids)[number]

export interface SnifferSourceStatus {
	profile_name: string
	path: string
}

export interface SnifferBrowserStatus {
	id: SnifferBrowserId
	name: string
	supported: boolean
	available: boolean
	source_count: number
	sources: Array<SnifferSourceStatus>
	message: string
}

export interface SnifferBookmarkItem {
	title: string
	url: string
	profile_name: string
	source_path: string
}

export interface SnifferReadResult {
	items: Array<SnifferBookmarkItem>
	error_count: number
	errors: Array<string>
}

export interface SnifferImportResult {
	browser: SnifferBrowserId
	name: string
	available: boolean
	source_count: number
	total_bookmarks: number
	candidate_count: number
	inserted_count: number
	ignored_existing_count: number
	ignored_duplicate_count: number
	ignored_invalid_count: number
	error_count: number
	errors: Array<string>
	inserted_preview: Array<{
		title: string
		url: string
	}>
	message: string
}
