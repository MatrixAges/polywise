export default (element: HTMLElement, target: string) => {
	let parent_element = element.parentNode as HTMLElement

	while (parent_element) {
		if (parent_element.classList?.contains?.(target)) {
			return true
		}

		if (parent_element.id === target) {
			return true
		}

		parent_element = parent_element.parentNode as HTMLElement
	}

	return false
}
