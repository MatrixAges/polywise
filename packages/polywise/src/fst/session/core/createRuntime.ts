import Session from '../index'
import composeRuntime from './composeRuntime'

import type { Descriptor, Plugin } from './types'

export default async (d: Descriptor, defs: Array<Plugin>) => {
	const s = new Session(d)
	const items = await Promise.all(
		defs.map(plugin =>
			Promise.resolve(plugin.setup(s)).then(setup => ({
				...setup,
				order: plugin.order
			}))
		)
	)

	composeRuntime(s, items)

	return s
}
