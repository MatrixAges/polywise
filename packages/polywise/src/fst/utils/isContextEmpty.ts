import type { Context } from '../types'

export default (context: Context): boolean => {
	for (const value of Object.values(context)) {
		if (value !== null && value !== undefined) {
			if (Array.isArray(value)) {
				if (value.length > 0) return false
			} else if (typeof value === 'object') {
				if (Object.keys(value).length > 0) return false
			} else {
				return false
			}
		}
	}
	return true
}
