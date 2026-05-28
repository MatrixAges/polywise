import mergeHookResult from './mergeHookResult'

import type { Hook } from '../core/types'
import type Session from '../index'

export default async <T>(s: Session, hook: Hook<T>, data: T) => {
	const next = await hook(s, data)

	return mergeHookResult(data, next)
}
