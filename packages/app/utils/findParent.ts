export default (element: HTMLElement, selector: string) => {
	let parent_element = element.parentNode as HTMLElement

	while (parent_element) {
		if (parent_element.classList?.contains?.(selector)) {
			return parent_element
		}

		if (parent_element.id === selector) {
			return parent_element
		}

		parent_element = parent_element.parentNode as HTMLElement
	}

	return null
}
