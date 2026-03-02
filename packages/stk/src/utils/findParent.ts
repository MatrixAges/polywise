export default (target: HTMLElement, selector: string) => {
	let parent = target

	while (parent) {
		if (parent?.matches(selector)) {
			return parent
		}

		parent = parent?.parentElement
	}

	return null
}
