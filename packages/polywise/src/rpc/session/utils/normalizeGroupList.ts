import ensureArray from '../../../utils/ensureArray'

import type { SessionGroupItem } from './types'

export default (value: unknown) => {
	return ensureArray<unknown>(value)
		.map(item => {
			if (!item || typeof item !== 'object') return null

			const target = item as Record<string, unknown>
			const name =
				typeof target.name === 'string'
					? target.name
					: typeof target.group === 'string'
						? target.group
						: ''
			const created_at = typeof target.created_at === 'number' ? target.created_at : Date.now()
			const updated_at = typeof target.updated_at === 'number' ? target.updated_at : created_at
			const items = ensureArray<string>(target.items).filter(session_id => typeof session_id === 'string')

			if (!name) return null

			return { name, created_at, updated_at, items }
		})
		.filter((item): item is SessionGroupItem => item !== null)
}
