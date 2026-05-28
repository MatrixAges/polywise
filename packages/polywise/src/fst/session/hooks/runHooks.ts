import runHook from './runHook'

import type { HookName } from '../core/types'
import type Session from '../index'

export default async <T>(s: Session, name: HookName, data: T) => {
	const hooks = s.hooks[name] || []
	let next = data

	for (const hook of hooks) {
		next = await runHook(s, hook as any, next)
	}

	return next
}
