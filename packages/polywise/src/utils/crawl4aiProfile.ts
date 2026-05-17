import os from 'node:os'
import path from 'node:path'
import { app_path } from '@core/consts/app'
import fs from 'fs-extra'

type Crawl4aiManagedProfileMeta = {
	version: 1
	profile_name: string
	source_profile_name: string
	source_root_path: string
	created_at: string
}

export type ChromeProfileSource = {
	profile_name: string
	root_path: string
	profile_path: string
}

export type Crawl4aiManagedProfileInfo = {
	managed_profile_path: string
	managed_profile_exists: boolean
	profile_name: string | null
	source_profile_name: string | null
	available_source_profiles: Array<string>
	preferred_source_profile_name: string | null
}

const chrome_user_data_dir_map = {
	darwin: path.resolve(os.homedir(), 'Library/Application Support/Google/Chrome'),
	linux: path.resolve(os.homedir(), '.config/google-chrome'),
	win32: process.env.LOCALAPPDATA ? path.resolve(process.env.LOCALAPPDATA, 'Google/Chrome/User Data') : ''
} as const

const managed_profile_dir_name = 'polywise-default'
const managed_profile_meta_file_name = '.polywise-crawl4ai-profile.json'
const excluded_copy_entries = new Set([
	'Cache',
	'Code Cache',
	'GPUCache',
	'GrShaderCache',
	'DawnCache',
	'ShaderCache',
	'Crashpad',
	'SingletonCookie',
	'SingletonLock',
	'SingletonSocket',
	'DevToolsActivePort'
])

const getChromeUserDataDir = () => {
	const override = process.env.CHROME_USER_DATA_DIR?.trim()

	if (override) {
		return override
	}

	if (!['darwin', 'linux', 'win32'].includes(process.platform)) {
		return ''
	}

	return chrome_user_data_dir_map[process.platform as keyof typeof chrome_user_data_dir_map] || ''
}

export const getCrawl4aiBaseDirectory = () => {
	return process.env.CRAWL4_AI_BASE_DIRECTORY?.trim() || app_path
}

const getManagedProfilesRoot = () => {
	return path.resolve(getCrawl4aiBaseDirectory(), '.crawl4ai', 'profiles')
}

const getManagedProfilePath = () => {
	return path.resolve(getManagedProfilesRoot(), managed_profile_dir_name)
}

const getManagedProfileMetaPath = () => {
	return path.resolve(getManagedProfilePath(), managed_profile_meta_file_name)
}

const isChromeProfileDir = async (profile_path: string) => {
	return await fs.pathExists(path.resolve(profile_path, 'Preferences'))
}

const getPreferredProfileName = async (root_path: string, available_profile_names: Array<string>) => {
	const local_state_path = path.resolve(root_path, 'Local State')

	try {
		const local_state = await fs.readJson(local_state_path)
		const last_used = local_state?.profile?.last_used

		if (typeof last_used === 'string' && available_profile_names.includes(last_used)) {
			return last_used
		}
	} catch {}

	if (available_profile_names.includes('Default')) {
		return 'Default'
	}

	return available_profile_names[0] ?? null
}

const shouldCopyProfileEntry = (src: string) => {
	const entry_name = path.basename(src)

	if (excluded_copy_entries.has(entry_name)) {
		return false
	}

	if (entry_name.endsWith('.tmp') || entry_name.endsWith('.lock')) {
		return false
	}

	return true
}

export const resolveChromeProfileSources = async (): Promise<Array<ChromeProfileSource>> => {
	const root_path = getChromeUserDataDir()

	if (!root_path || !(await fs.pathExists(root_path))) {
		return []
	}

	const entries = await fs.readdir(root_path, { withFileTypes: true })
	const sources = [] as Array<ChromeProfileSource>

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue
		}

		const profile_path = path.resolve(root_path, entry.name)

		if (!(await isChromeProfileDir(profile_path))) {
			continue
		}

		sources.push({
			profile_name: entry.name,
			root_path,
			profile_path
		})
	}

	return sources
}

export const getPolywiseCrawl4aiManagedProfile = async (): Promise<Crawl4aiManagedProfileInfo> => {
	const managed_profile_path = getManagedProfilePath()
	const managed_profile_exists = await fs.pathExists(managed_profile_path)
	const sources = await resolveChromeProfileSources()
	const available_source_profiles = sources.map(item => item.profile_name)
	const preferred_source_profile_name = await getPreferredProfileName(
		sources[0]?.root_path ?? getChromeUserDataDir(),
		available_source_profiles
	)
	let profile_name: string | null = null
	let source_profile_name: string | null = null

	if (managed_profile_exists) {
		try {
			const meta = (await fs.readJson(getManagedProfileMetaPath())) as Crawl4aiManagedProfileMeta
			profile_name = meta.profile_name
			source_profile_name = meta.source_profile_name
		} catch {
			const entries = await fs.readdir(managed_profile_path, { withFileTypes: true })
			const first_profile = entries.find(entry => entry.isDirectory() && !entry.name.startsWith('.'))
			profile_name = first_profile?.name ?? null
		}
	}

	return {
		managed_profile_path,
		managed_profile_exists,
		profile_name,
		source_profile_name,
		available_source_profiles,
		preferred_source_profile_name
	}
}

export const createPolywiseCrawl4aiProfile = async (recreate = false) => {
	const sources = await resolveChromeProfileSources()

	if (sources.length === 0) {
		throw new Error('No local Chrome profile was detected.')
	}

	const preferred_profile_name = await getPreferredProfileName(
		sources[0].root_path,
		sources.map(item => item.profile_name)
	)
	const source = sources.find(item => item.profile_name === preferred_profile_name) ?? sources[0]
	const managed_profile_path = getManagedProfilePath()
	const target_profile_path = path.resolve(managed_profile_path, source.profile_name)
	const already_exists = await fs.pathExists(managed_profile_path)

	if (already_exists && !recreate) {
		return {
			created: false,
			recreated: false,
			source_profile_name: source.profile_name,
			managed_profile_path,
			profile_name: source.profile_name
		}
	}

	await fs.remove(managed_profile_path)
	await fs.ensureDir(managed_profile_path)

	for (const root_file_name of ['Local State', 'First Run']) {
		const root_file_path = path.resolve(source.root_path, root_file_name)

		if (await fs.pathExists(root_file_path)) {
			await fs.copy(root_file_path, path.resolve(managed_profile_path, root_file_name), {
				overwrite: true
			})
		}
	}

	await fs.copy(source.profile_path, target_profile_path, {
		overwrite: true,
		filter: shouldCopyProfileEntry
	})

	const meta: Crawl4aiManagedProfileMeta = {
		version: 1,
		profile_name: source.profile_name,
		source_profile_name: source.profile_name,
		source_root_path: source.root_path,
		created_at: new Date().toISOString()
	}

	await fs.writeJson(getManagedProfileMetaPath(), meta, { spaces: 2 })

	return {
		created: true,
		recreated: recreate,
		source_profile_name: source.profile_name,
		managed_profile_path,
		profile_name: source.profile_name
	}
}

export const resolvePolywiseCrawl4aiProfileConfig = async () => {
	const user_data_dir = process.env.CRAWL4AI_PROFILE_PATH?.trim()
	const profile_name = process.env.CRAWL4AI_PROFILE_NAME?.trim()

	if (user_data_dir) {
		return {
			user_data_dir,
			profile_name: profile_name || null
		}
	}

	const managed = await getPolywiseCrawl4aiManagedProfile()

	if (!managed.managed_profile_exists) {
		return null
	}

	return {
		user_data_dir: managed.managed_profile_path,
		profile_name: managed.profile_name
	}
}
