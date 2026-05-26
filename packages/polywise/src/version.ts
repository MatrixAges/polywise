import { readFileSync } from 'node:fs'

const fallback_version = '0.0.0'
let version_cache: string | null = null

const readPackageVersion = () => {
	try {
		const package_json = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as {
			version?: unknown
		}

		return typeof package_json.version === 'string' && package_json.version
			? package_json.version
			: fallback_version
	} catch {
		return fallback_version
	}
}

export const getPolywiseVersion = () => {
	if (!version_cache) {
		version_cache = readPackageVersion()
	}

	return version_cache
}

export const polywise_version = getPolywiseVersion()
