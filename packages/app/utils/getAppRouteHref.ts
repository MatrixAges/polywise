import { browser_basename, is_electron, is_prod } from './is'

export default (path: string) => {
	if (!is_electron && is_prod) {
		const normalized_path = path.startsWith('/') ? path : `/${path}`

		return normalized_path === '/' ? `${browser_basename}/` : `${browser_basename}${normalized_path}`
	}

	const normalized_path = path.startsWith('/') ? path : `/${path}`

	return `${window.location.origin}${window.location.pathname}#${normalized_path}`
}
