import { getAppPath, is_dev } from '@desktop/utils'

export const getLoadURL = (path: string, search_params?: Record<string, string>) => {
	const query_string = search_params ? `?${new URLSearchParams(search_params).toString()}` : ''

	return is_dev
		? `http://localhost:8080/#${path}${query_string}`
		: `file://${getAppPath('index.html')}#${path}${query_string}`
}
