import type { Caps, PluginSetup } from './types'

export default <K extends keyof Caps>(
	caps: Caps,
	key: K,
	next: Caps[K] | undefined,
	owner: string,
	used: Map<keyof Caps, string>
) => {
	if (!next) {
		return
	}

	const prev = used.get(key)

	if (prev) {
		throw new Error(`Session cap conflict on ${String(key)} between ${prev} and ${owner}`)
	}

	caps[key] = next
	used.set(key, owner)
}
