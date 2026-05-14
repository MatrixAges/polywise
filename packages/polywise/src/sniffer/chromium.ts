import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'

import { buildSnifferFolderKey } from './types'

import type {
	SnifferBookmarkItem,
	SnifferBrowserId,
	SnifferBrowserStatus,
	SnifferFolderNode,
	SnifferReadArgs,
	SnifferReadResult,
	SnifferSourceStatus
} from './types'

interface ChromiumBrowserConfig {
	id: Extract<SnifferBrowserId, 'chrome' | 'edge'>
	name: string
}

interface ChromiumBookmarkNode {
	id?: string
	type?: string
	name?: string
	url?: string
	children?: Array<ChromiumBookmarkNode>
}

interface ChromiumSourceSnapshot {
	items: Array<SnifferBookmarkItem>
	folders: Array<SnifferFolderNode>
}

const chromium_root_name_map = {
	bookmark_bar: 'Bookmarks Bar',
	other: 'Other Bookmarks',
	synced: 'Mobile Bookmarks',
	managed: 'Managed Bookmarks'
} as const

const browser_base_dirs = {
	chrome: {
		darwin: path.resolve(os.homedir(), 'Library/Application Support/Google/Chrome'),
		linux: path.resolve(os.homedir(), '.config/google-chrome'),
		win32: process.env.LOCALAPPDATA ? path.resolve(process.env.LOCALAPPDATA, 'Google/Chrome/User Data') : ''
	},
	edge: {
		darwin: path.resolve(os.homedir(), 'Library/Application Support/Microsoft Edge'),
		linux: path.resolve(os.homedir(), '.config/microsoft-edge'),
		win32: process.env.LOCALAPPDATA ? path.resolve(process.env.LOCALAPPDATA, 'Microsoft/Edge/User Data') : ''
	}
} as const

const getBaseDir = (browser_id: ChromiumBrowserConfig['id']) => {
	if (!['darwin', 'linux', 'win32'].includes(process.platform)) {
		return ''
	}

	return browser_base_dirs[browser_id][process.platform as 'darwin' | 'linux' | 'win32'] || ''
}

const resolveChromiumSources = async (browser_id: ChromiumBrowserConfig['id']) => {
	const base_dir = getBaseDir(browser_id)

	if (!base_dir || !(await fs.pathExists(base_dir))) {
		return [] as Array<SnifferSourceStatus>
	}

	const entries = await fs.readdir(base_dir, { withFileTypes: true })
	const source_list = [] as Array<SnifferSourceStatus>

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue
		}

		const bookmark_path = path.resolve(base_dir, entry.name, 'Bookmarks')

		if (!(await fs.pathExists(bookmark_path))) {
			continue
		}

		source_list.push({
			id: bookmark_path,
			profile_name: entry.name,
			path: bookmark_path,
			bookmark_count: 0,
			folders: []
		})
	}

	return source_list
}

const buildChromiumFolderSnapshot = (
	node: ChromiumBookmarkNode | undefined,
	source: SnifferSourceStatus,
	parent_path: string,
	fallback_id: string,
	fallback_name: string
) => {
	if (!node || (!node.children?.length && node.type !== 'folder')) {
		return null
	}

	const folder_id = node.id?.trim() || fallback_id
	const folder_name = node.name?.trim() || fallback_name
	const folder_key = buildSnifferFolderKey(source.id, folder_id)
	const folder_path = parent_path ? `${parent_path}/${folder_name}` : folder_name
	const items = [] as Array<SnifferBookmarkItem>
	const children = [] as Array<SnifferFolderNode>

	for (const [index, child] of (node.children ?? []).entries()) {
		if (child.type === 'url' && typeof child.url === 'string') {
			items.push({
				title: child.name?.trim() || child.url,
				url: child.url,
				profile_name: source.profile_name,
				source_id: source.id,
				source_path: source.path,
				folder_key,
				folder_path
			})

			continue
		}

		const child_snapshot = buildChromiumFolderSnapshot(
			child,
			source,
			folder_path,
			`${folder_id}/${index}`,
			child.name?.trim() || `Folder ${index + 1}`
		)

		if (!child_snapshot) {
			continue
		}

		children.push(child_snapshot.folder)
		items.push(...child_snapshot.items)
	}

	if (items.length === 0) {
		return null
	}

	return {
		folder: {
			key: folder_key,
			name: folder_name,
			path: folder_path,
			bookmark_count: items.length,
			children
		},
		items
	}
}

const readChromiumSource = async (source: SnifferSourceStatus): Promise<ChromiumSourceSnapshot> => {
	const content = await fs.readJson(source.path)
	const roots =
		typeof content === 'object' && content ? (content.roots as Record<string, ChromiumBookmarkNode>) : {}
	const items = [] as Array<SnifferBookmarkItem>
	const folders = [] as Array<SnifferFolderNode>

	for (const [root_key, root] of Object.entries(roots ?? {})) {
		const folder_snapshot = buildChromiumFolderSnapshot(
			root,
			source,
			'',
			`root:${root_key}`,
			chromium_root_name_map[root_key as keyof typeof chromium_root_name_map] || root_key
		)

		if (!folder_snapshot) {
			continue
		}

		folders.push(folder_snapshot.folder)
		items.push(...folder_snapshot.items)
	}

	return {
		items,
		folders
	}
}

const hydrateChromiumSources = async (sources: Array<SnifferSourceStatus>) => {
	return Promise.all(
		sources.map(async source => {
			try {
				const snapshot = await readChromiumSource(source)

				return {
					...source,
					bookmark_count: snapshot.items.length,
					folders: snapshot.folders,
					error: undefined
				} satisfies SnifferSourceStatus
			} catch (error) {
				return {
					...source,
					bookmark_count: 0,
					folders: [],
					error: error instanceof Error ? error.message : String(error)
				} satisfies SnifferSourceStatus
			}
		})
	)
}

export const getChromiumBookmarkStatus = async (config: ChromiumBrowserConfig): Promise<SnifferBrowserStatus> => {
	const supported = ['darwin', 'linux', 'win32'].includes(process.platform)
	const base_dir = getBaseDir(config.id)

	if (!supported) {
		return {
			id: config.id,
			name: config.name,
			supported: false,
			available: false,
			source_count: 0,
			sources: [],
			message: 'Current platform is not supported for local bookmark sniffing.'
		}
	}

	if (!base_dir) {
		return {
			id: config.id,
			name: config.name,
			supported: true,
			available: false,
			source_count: 0,
			sources: [],
			message: 'Browser data directory is not configured on this system.'
		}
	}

	const resolved_sources = await resolveChromiumSources(config.id)
	const sources = await hydrateChromiumSources(resolved_sources)

	return {
		id: config.id,
		name: config.name,
		supported: true,
		available: sources.length > 0,
		source_count: sources.length,
		sources,
		message:
			sources.length > 0
				? `${sources.length} profile(s) ready for bookmark import.`
				: 'No bookmark profiles found.'
	}
}

export const readChromiumBookmarks = async (
	sources: Array<SnifferSourceStatus>,
	args: SnifferReadArgs = {}
): Promise<SnifferReadResult> => {
	const items = [] as Array<SnifferBookmarkItem>
	const errors = [] as Array<string>
	const selected_folder_key_set = Array.isArray(args.folder_keys) ? new Set(args.folder_keys) : null

	for (const source of sources) {
		try {
			const snapshot = await readChromiumSource(source)
			const next_items = selected_folder_key_set
				? snapshot.items.filter(item => selected_folder_key_set.has(item.folder_key))
				: snapshot.items

			items.push(...next_items)
		} catch (error) {
			errors.push(`${source.profile_name}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	return {
		items,
		error_count: errors.length,
		errors
	}
}

export const chrome_browser_config = { id: 'chrome', name: 'Chrome' } as const
export const edge_browser_config = { id: 'edge', name: 'Edge' } as const
