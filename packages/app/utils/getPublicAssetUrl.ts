import { browser_basename, is_electron, is_prod } from './is'

export default (path: string) => {
	const normalized_path = path.replace(/^\/+/, '')

	if (is_electron) {
		return `./${normalized_path}`
	}

	if (is_prod) {
		return `${browser_basename}/${normalized_path}`
	}

	return `/${normalized_path}`
}
