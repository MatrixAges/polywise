import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import Sqlite from 'better-sqlite3'
import fs from 'fs-extra'

import { buildSnifferFolderKey } from './types'

import type {
	SnifferBookmarkItem,
	SnifferBrowserStatus,
	SnifferFolderNode,
	SnifferReadArgs,
	SnifferReadResult,
	SnifferSourceStatus
} from './types'

interface FirefoxProfileEntry {
	Name?: string
	Path?: string
	IsRelative?: string
}

interface FirefoxBookmarkRow {
	id: number
	parent: number
	type: number
	title: string
	url: string | null
	position: number
}

interface FirefoxRootRow {
	root_name: string
	folder_id: number
}

interface FirefoxBookmarkSnapshot {
	rows: Array<FirefoxBookmarkRow>
	roots: Array<FirefoxRootRow>
}

interface FirefoxSourceSnapshot {
	items: Array<SnifferBookmarkItem>
	folders: Array<SnifferFolderNode>
}

const firefox_root_name_map = {
	toolbar: 'Bookmarks Toolbar',
	menu: 'Bookmarks Menu',
	unfiled: 'Other Bookmarks',
	mobile: 'Mobile Bookmarks'
} as const

const getFirefoxRootDir = () => {
	if (process.platform === 'darwin') {
		return path.resolve(os.homedir(), 'Library/Application Support/Firefox')
	}

	if (process.platform === 'linux') {
		return path.resolve(os.homedir(), '.mozilla/firefox')
	}

	if (process.platform === 'win32') {
		return process.env.APPDATA ? path.resolve(process.env.APPDATA, 'Mozilla/Firefox') : ''
	}

	return ''
}

const parseProfilesIni = (content: string) => {
	const sections = [] as Array<FirefoxProfileEntry>
	let current = null as FirefoxProfileEntry | null

	for (const raw_line of content.split(/\r?\n/g)) {
		const line = raw_line.trim()

		if (!line || line.startsWith(';') || line.startsWith('#')) {
			continue
		}

		if (line.startsWith('[') && line.endsWith(']')) {
			if (current) {
				sections.push(current)
			}

			current = {}

			continue
		}

		if (!current) {
			continue
		}

		const index = line.indexOf('=')

		if (index <= 0) {
			continue
		}

		const key = line.slice(0, index).trim() as keyof FirefoxProfileEntry
		const value = line.slice(index + 1).trim()

		current[key] = value
	}

	if (current) {
		sections.push(current)
	}

	return sections
}

const resolveFirefoxSources = async () => {
	const root_dir = getFirefoxRootDir()

	if (!root_dir || !(await fs.pathExists(root_dir))) {
		return [] as Array<SnifferSourceStatus>
	}

	const profiles_ini_path = path.resolve(root_dir, 'profiles.ini')
	const source_list = [] as Array<SnifferSourceStatus>

	if (await fs.pathExists(profiles_ini_path)) {
		const content = await fs.readFile(profiles_ini_path, 'utf8')
		const profiles = parseProfilesIni(content)

		for (const profile of profiles) {
			if (!profile.Path) {
				continue
			}

			const profile_dir = profile.IsRelative === '0' ? profile.Path : path.resolve(root_dir, profile.Path)
			const sqlite_path = path.resolve(profile_dir, 'places.sqlite')

			if (!(await fs.pathExists(sqlite_path))) {
				continue
			}

			source_list.push({
				id: sqlite_path,
				profile_name: profile.Name || path.basename(profile_dir),
				path: sqlite_path,
				bookmark_count: 0,
				folders: []
			})
		}
	}

	if (source_list.length > 0) {
		return source_list
	}

	const profiles_dir = path.resolve(root_dir, 'Profiles')

	if (!(await fs.pathExists(profiles_dir))) {
		return []
	}

	const entries = await fs.readdir(profiles_dir, { withFileTypes: true })

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue
		}

		const sqlite_path = path.resolve(profiles_dir, entry.name, 'places.sqlite')

		if (!(await fs.pathExists(sqlite_path))) {
			continue
		}

		source_list.push({
			id: sqlite_path,
			profile_name: entry.name,
			path: sqlite_path,
			bookmark_count: 0,
			folders: []
		})
	}

	return source_list
}

const queryFirefoxBookmarks = (database_path: string): Promise<FirefoxBookmarkSnapshot> => {
	const temp_path = path.resolve(os.tmpdir(), `polywise-firefox-${randomUUID()}.sqlite`)
	const temp_sidecar_paths = [`${temp_path}-wal`, `${temp_path}-shm`]

	return Promise.resolve()
		.then(async () => {
			await fs.copy(database_path, temp_path)

			for (const suffix of ['-wal', '-shm']) {
				const source_path = `${database_path}${suffix}`
				const target_path = `${temp_path}${suffix}`

				if (await fs.pathExists(source_path)) {
					await fs.copy(source_path, target_path)
				}
			}
		})
		.then(() => {
			const database = new Sqlite(temp_path, { readonly: true, fileMustExist: true })

			try {
				const rows = database
					.prepare(
						`
							SELECT
								b.id AS id,
								b.parent AS parent,
								b.type AS type,
								COALESCE(b.title, '') AS title,
								p.url AS url,
								b.position AS position
							FROM moz_bookmarks b
							LEFT JOIN moz_places p ON p.id = b.fk
							WHERE b.type IN (1, 2)
						`
					)
					.all() as Array<FirefoxBookmarkRow>
				const roots = database
					.prepare(
						`
							SELECT
								root_name,
								folder_id
							FROM moz_bookmarks_roots
						`
					)
					.all() as Array<FirefoxRootRow>

				return {
					rows,
					roots
				}
			} finally {
				database.close()
			}
		})
		.finally(async () => {
			await Promise.all(temp_sidecar_paths.map(item => fs.remove(item)))
			await fs.remove(temp_path)
		})
}

const buildFirefoxFolderSnapshot = (args: {
	source: SnifferSourceStatus
	folder_id: number
	folder_name: string
	parent_path: string
	rows_by_parent: Map<number, Array<FirefoxBookmarkRow>>
}): { folder: SnifferFolderNode; items: Array<SnifferBookmarkItem> } | null => {
	const { source, folder_id, folder_name, parent_path, rows_by_parent } = args
	const folder_key = buildSnifferFolderKey(source.id, folder_id)
	const folder_path = parent_path ? `${parent_path}/${folder_name}` : folder_name
	const items = [] as Array<SnifferBookmarkItem>
	const children = [] as Array<SnifferFolderNode>

	for (const row of rows_by_parent.get(folder_id) ?? []) {
		if (row.type === 1 && typeof row.url === 'string') {
			items.push({
				title: row.title?.trim() || row.url,
				url: row.url,
				profile_name: source.profile_name,
				source_id: source.id,
				source_path: source.path,
				folder_key,
				folder_path
			})

			continue
		}

		if (row.type !== 2) {
			continue
		}

		const child_snapshot = buildFirefoxFolderSnapshot({
			source,
			folder_id: row.id,
			folder_name: row.title?.trim() || `Folder ${row.id}`,
			parent_path: folder_path,
			rows_by_parent
		})

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

const readFirefoxSource = async (source: SnifferSourceStatus): Promise<FirefoxSourceSnapshot> => {
	const snapshot = await queryFirefoxBookmarks(source.path)
	const items = [] as Array<SnifferBookmarkItem>
	const folders = [] as Array<SnifferFolderNode>
	const rows_by_parent = new Map<number, Array<FirefoxBookmarkRow>>()

	for (const row of snapshot.rows) {
		const list = rows_by_parent.get(row.parent) ?? []

		list.push(row)
		rows_by_parent.set(row.parent, list)
	}

	for (const list of rows_by_parent.values()) {
		list.sort((a, b) => a.position - b.position)
	}

	const root_rows = snapshot.roots.filter(root => root.root_name in firefox_root_name_map)

	for (const root of root_rows) {
		const folder_snapshot = buildFirefoxFolderSnapshot({
			source,
			folder_id: root.folder_id,
			folder_name:
				firefox_root_name_map[root.root_name as keyof typeof firefox_root_name_map] || root.root_name,
			parent_path: '',
			rows_by_parent
		})

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

const hydrateFirefoxSources = async (sources: Array<SnifferSourceStatus>) => {
	return Promise.all(
		sources.map(async source => {
			try {
				const snapshot = await readFirefoxSource(source)

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

export const getFirefoxBookmarkStatus = async (): Promise<SnifferBrowserStatus> => {
	const supported = ['darwin', 'linux', 'win32'].includes(process.platform)

	if (!supported) {
		return {
			id: 'firefox',
			name: 'Firefox',
			supported: false,
			available: false,
			source_count: 0,
			sources: [],
			message: 'Current platform is not supported for local bookmark sniffing.'
		}
	}

	const resolved_sources = await resolveFirefoxSources()
	const sources = await hydrateFirefoxSources(resolved_sources)

	return {
		id: 'firefox',
		name: 'Firefox',
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

export const readFirefoxBookmarks = async (
	sources: Array<SnifferSourceStatus>,
	args: SnifferReadArgs = {}
): Promise<SnifferReadResult> => {
	const items = [] as Array<SnifferBookmarkItem>
	const errors = [] as Array<string>
	const selected_folder_key_set = Array.isArray(args.folder_keys) ? new Set(args.folder_keys) : null

	for (const source of sources) {
		try {
			const snapshot = await readFirefoxSource(source)
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
