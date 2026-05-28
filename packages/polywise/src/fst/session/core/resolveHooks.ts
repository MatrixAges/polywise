import type { HookMap, PluginSetup } from './types'

export default (items: Array<PluginSetup>) => {
	const hooks = {} as HookMap

	for (const item of items) {
		for (const [name, list] of Object.entries(item.hooks || {})) {
			if (!list?.length) {
				continue
			}

			hooks[name as keyof HookMap] = [...(hooks[name as keyof HookMap] || []), ...list]
		}
	}

	return hooks
}
