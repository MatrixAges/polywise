import type { RPCOutput } from '@/types'

export type LinkcaseItem = RPCOutput['linkcase']['query']['items'][number]
export type LinkcaseDetail = NonNullable<RPCOutput['linkcase']['read']>
export type LinkcaseFilterType = 'title' | 'link'
export type LinkcaseBatchIntervalUnit = 'second' | 'minute'
export type LinkcaseSnifferBrowserStatus = RPCOutput['sniffer']['status']['browsers'][number]
export type LinkcaseSnifferBrowserId = LinkcaseSnifferBrowserStatus['id']
export type LinkcaseSnifferSourceStatus = LinkcaseSnifferBrowserStatus['sources'][number]
export type LinkcaseSnifferFolderNode = LinkcaseSnifferSourceStatus['folders'][number]
export type LinkcaseSnifferImportResult = RPCOutput['sniffer']['importBookmarks']

export const getLinkcaseSnifferFolderKeys = (folders: Array<LinkcaseSnifferFolderNode>): Array<string> => {
	const keys = [] as Array<string>

	const visit = (nodes: Array<LinkcaseSnifferFolderNode>) => {
		for (const node of nodes) {
			keys.push(node.key)
			visit(node.children)
		}
	}

	visit(folders)

	return keys
}

export const getLinkcaseSnifferBrowserFolderKeys = (browser: LinkcaseSnifferBrowserStatus): Array<string> => {
	return browser.sources.flatMap(source => getLinkcaseSnifferFolderKeys(source.folders))
}

const bytes_to_base64 = (value: Uint8Array) => {
	let binary = ''
	const chunk_size = 0x8000

	for (let index = 0; index < value.length; index += chunk_size) {
		const chunk = value.subarray(index, index + chunk_size)

		binary += String.fromCharCode(...chunk)
	}

	return btoa(binary)
}

const normalize_favicon = (value: unknown) => {
	if (!value) {
		return null
	}

	if (value instanceof Uint8Array) {
		return value
	}

	if (Array.isArray(value)) {
		return new Uint8Array(value)
	}

	return null
}

const guess_favicon_mime = (value: Uint8Array) => {
	if (value.length >= 4 && value[0] === 0x89 && value[1] === 0x50 && value[2] === 0x4e && value[3] === 0x47) {
		return 'image/png'
	}

	if (value.length >= 3 && value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff) {
		return 'image/jpeg'
	}

	if (value.length >= 6) {
		const header = String.fromCharCode(...value.slice(0, 6))

		if (header === 'GIF87a' || header === 'GIF89a') {
			return 'image/gif'
		}
	}

	if (value.length >= 4 && value[0] === 0x00 && value[1] === 0x00 && value[2] === 0x01 && value[3] === 0x00) {
		return 'image/x-icon'
	}

	const text_head = new TextDecoder().decode(value.slice(0, 128)).trim().toLowerCase()

	if (text_head.startsWith('<svg') || text_head.startsWith('<?xml')) {
		return 'image/svg+xml'
	}

	return 'image/png'
}

export const getLinkFaviconSrc = (favicon: unknown) => {
	const bytes = normalize_favicon(favicon)

	if (!bytes?.length) {
		return ''
	}

	return `data:${guess_favicon_mime(bytes)};base64,${bytes_to_base64(bytes)}`
}
