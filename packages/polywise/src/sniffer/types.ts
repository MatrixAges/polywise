export const sniffer_browser_ids = ['chrome', 'firefox', 'edge'] as const

export type SnifferBrowserId = (typeof sniffer_browser_ids)[number]

export interface SnifferFolderNode {
	key: string
	name: string
	path: string
	bookmark_count: number
	children: Array<SnifferFolderNode>
}

export interface SnifferSourceStatus {
	id: string
	profile_name: string
	path: string
	bookmark_count: number
	folders: Array<SnifferFolderNode>
	error?: string
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
	source_id: string
	source_path: string
	folder_key: string
	folder_path: string
}

export interface SnifferReadArgs {
	folder_keys?: Array<string>
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

export const buildSnifferFolderKey = (source_id: string, folder_id: string | number) =>
	`${source_id}::${String(folder_id)}`
