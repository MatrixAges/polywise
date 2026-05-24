import type { DocsMenuGroup } from '@website/types'

export default (menu: DocsMenuGroup[], key: string) => {
	let result = { parent_index: -1, index: -1 }

	for (let i = 0; i < menu.length; i++) {
		const item = menu[i]!

		if (item.key === key) {
			result.parent_index = i
			result.index = -1

			return result
		}

		if (item.children && item.children.length > 0) {
			for (let j = 0; j < item.children.length; j++) {
				const child = item.children[j]!

				if (child.key === key) {
					result.parent_index = i
					result.index = j
					return result
				}
			}
		}
	}

	return result
}
