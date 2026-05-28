import { browser_basename, is_electron } from './is'

export default (path: string) => {
	if (!is_electron) {
		const normalized_path = path.startsWith('/') ? path : `/${path}`

		return normalized_path === '/' ? `${browser_basename}/` : `${browser_basename}${normalized_path}`
	}

	const normalized_path = path.startsWith('/') ? path : `/${path}`

	return `${window.location.origin}${window.location.pathname}#${normalized_path}`
}
