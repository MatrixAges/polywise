import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'

import type {
	SnifferBookmarkItem,
	SnifferBrowserId,
	SnifferBrowserStatus,
	SnifferReadResult,
	SnifferSourceStatus
} from './types'

interface ChromiumBrowserConfig {
	id: Extract<SnifferBrowserId, 'chrome' | 'edge'>
	name: string
}

interface ChromiumBookmarkNode {
	type?: string
	name?: string
	url?: string
	children?: Array<ChromiumBookmarkNode>
}

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
			profile_name: entry.name,
			path: bookmark_path
		})
	}

	return source_list
}

const walkBookmarkNode = (
	node: ChromiumBookmarkNode | undefined,
	source: SnifferSourceStatus,
	items: Array<SnifferBookmarkItem>
) => {
	if (!node) {
		return
	}

	if (node.type === 'url' && typeof node.url === 'string') {
		items.push({
			title: node.name?.trim() || node.url,
			url: node.url,
			profile_name: source.profile_name,
			source_path: source.path
		})
	}

	for (const child of node.children ?? []) {
		walkBookmarkNode(child, source, items)
	}
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

	const sources = await resolveChromiumSources(config.id)

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

export const readChromiumBookmarks = async (sources: Array<SnifferSourceStatus>): Promise<SnifferReadResult> => {
	const items = [] as Array<SnifferBookmarkItem>
	const errors = [] as Array<string>

	for (const source of sources) {
		try {
			const content = await fs.readJson(source.path)
			const roots =
				typeof content === 'object' && content
					? (content.roots as Record<string, ChromiumBookmarkNode>)
					: {}

			for (const root of Object.values(roots ?? {})) {
				walkBookmarkNode(root, source, items)
			}
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
