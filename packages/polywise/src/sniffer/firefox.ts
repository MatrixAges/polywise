import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import Sqlite from 'better-sqlite3'
import fs from 'fs-extra'

import type { SnifferBookmarkItem, SnifferBrowserStatus, SnifferReadResult, SnifferSourceStatus } from './types'

interface FirefoxProfileEntry {
	Name?: string
	Path?: string
	IsRelative?: string
}

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
				profile_name: profile.Name || path.basename(profile_dir),
				path: sqlite_path
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
			profile_name: entry.name,
			path: sqlite_path
		})
	}

	return source_list
}

const queryFirefoxBookmarks = (database_path: string) => {
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
				return database
					.prepare(
						`
							SELECT
								COALESCE(b.title, '') AS title,
								p.url AS url
							FROM moz_bookmarks b
							INNER JOIN moz_places p ON p.id = b.fk
							WHERE b.type = 1 AND p.url IS NOT NULL
						`
					)
					.all() as Array<{ title: string; url: string }>
			} finally {
				database.close()
			}
		})
		.finally(async () => {
			await Promise.all(temp_sidecar_paths.map(item => fs.remove(item)))
			await fs.remove(temp_path)
		})
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

	const sources = await resolveFirefoxSources()

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

export const readFirefoxBookmarks = async (sources: Array<SnifferSourceStatus>): Promise<SnifferReadResult> => {
	const items = [] as Array<SnifferBookmarkItem>
	const errors = [] as Array<string>

	for (const source of sources) {
		try {
			const rows = await queryFirefoxBookmarks(source.path)

			for (const row of rows) {
				items.push({
					title: row.title?.trim() || row.url,
					url: row.url,
					profile_name: source.profile_name,
					source_path: source.path
				})
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
