import { is_electron } from './is'

export default (path: string) => {
	if (!is_electron) {
		return path
	}

	const normalized_path = path.startsWith('/') ? path : `/${path}`

	return `${window.location.origin}${window.location.pathname}#${normalized_path}`
}
