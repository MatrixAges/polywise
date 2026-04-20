import ensureArray from '../../../utils/ensureArray'

import type { SessionPinItem } from './types'

export default (value: unknown) => {
	const now = Date.now()

	return ensureArray<unknown>(value)
		.map(item => {
			if (typeof item === 'string') {
				return {
					id: item,
					pin_at: now
				}
			}

			if (!item || typeof item !== 'object') {
				return null
			}

			const target = item as Record<string, unknown>
			const id = typeof target.id === 'string' ? target.id : ''
			const pin_at = typeof target.pin_at === 'number' ? target.pin_at : now

			if (!id) {
				return null
			}

			return { id, pin_at }
		})
		.filter((item): item is SessionPinItem => item !== null)
}
